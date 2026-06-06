using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using WebServer;

class Program {
    private struct ProjectInfo {
        public ProjectInfo(string name, string desc, string folder){
            Name = name;
            Description = desc;
            FolderPath = folder;
        }

        public string Name {get; init;}
        public string Description {get; init;}
        public string FolderPath {get; init;}
    }
    async static Task Main(){
        Server server = new();
        server.DefaultHtmlPath = @"./public/html/default.html";
        server.BaseDirectory = @"./public";
        server.Projects.Add("atoms");
        server.Projects.Add("management");
        server.Endpoints.Add("/projects", delegate(WebRequest request){
            request.ResponseHeaders.Add("Content-Type", "application/json;charset=utf-8");
            List<ProjectInfo> projectsData = new List<ProjectInfo>();
            foreach(string projectPath in Directory.EnumerateDirectories("./public/.projects/"))
            {
                string name = projectPath.Substring(projectPath.LastIndexOf("/") + 1);
                string officialName = name;
                string description = "No description";
                try
                {
                    Console.WriteLine($"{projectPath}/manifest.json");
                    using FileStream stream = File.OpenRead($"{projectPath}/manifest.json");
                    Manifest manifest = JsonSerializer.Deserialize<Manifest>(stream);
                    officialName = manifest.name;
                    description = manifest.description ?? "No description";
                }
                catch (FileNotFoundException)
                {
                    Console.WriteLine($"The ./public/.projects/{name}/manifest.json file doesn't exist.");
                    officialName = name;
                    description = "No description";
                }
                catch(Exception ex)
                {
                    Console.WriteLine($"Exception: {ex.Message}");
                }

                projectsData.Add(new ProjectInfo(officialName, description, name));
                Console.WriteLine($"{name} project added to te list.");
            }

            var jsonString = JsonSerializer.Serialize(projectsData);
            Console.WriteLine($"Serialized json: {jsonString}");
            UTF8Encoding encoder = new UTF8Encoding();
            request.SendRawData(encoder.GetBytes(jsonString));
            Console.WriteLine("Data serialized and sent.");
        });
        await server.Start();
    }
}