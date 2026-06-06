using System;
using System.Collections.Generic; // Dictionary
using System.Net; // HttpListener and his "derivatives"
using System.IO; // Stream, File, etc.
using System.Text; // Encoding
using System.Threading.Tasks;

namespace WebServer
{
    public sealed class Server
    {
        private readonly string[] URLs = ["https://192.168.1.106:1505/", "https://localhost:1505/"];
        public bool AutoAnswerGetRequests = true;
        private string _baseDirectory = ".";
        public string BaseDirectory
        {
            get { return _baseDirectory; }
            set
            {
                if (!value.EndsWith('/'))
                {
                    _baseDirectory = value;
                }
                else
                {
                    _baseDirectory = value.Substring(0, value.Length-1);
                }
            }
        }
        public string DefaultHtmlPath = @"./default.html";
        //public delegate GetCallback;
        private readonly HttpListener server = new();
        static readonly private Dictionary<string, string> MIMETypes = new Dictionary<string, string>()
        {
            {"js", "application/javascript"},
            {"css", "text/css"},
            {"html", "text/html"},
            {"json", "application/json"},
            {"svg", "image/svg+xml"},
            {"txt", "text/plain"},
            {"efi", "application/efi"},
            {"gz", "application/gzip"},
            {"http", "application/http"}, // when it is a pipeline, if a single message, 'message/http'
            {"mp4", "video/mp4"},
            {"pdf", "application/pdf"},
            {"sql", "application/sql"},
            {"wasm", "application/wasm"},
            {"zip", "application/zip"},
            {"gif", "image/gif"},
            {"png", "image/png"},
            {"jpg", "image/jpeg"},
            {"webp", "video/webp"}, // if it is a image, use 'image/webp'
            {"md", "text/markdown"},
            {"xml", "text/xml"},
        };
        public List<string> Projects = new List<string>{};

        public delegate void CustomResponse(WebRequest request);
        public Dictionary<string, CustomResponse> Endpoints = new Dictionary<string, CustomResponse>();

        /// <summary>
        ///  Append a prefix to the list of prefixes
        /// </summary>
        /// <param name="prefix">The prefix to be appended</param>
        /// <returns>
        ///  true if the operation was succesfull, or false if the operation was not possible.
        /// Ex.: the server was listening.
        /// </returns>
        public bool AddPrefix(string prefix)
        {
            if (server.IsListening)
            {
                return false;
            }
            URLs.Append(prefix);
            return true;
        }

        private void AnswerProjectsRequest(WebRequest request){
            string path = $"{BaseDirectory}/.projects";

            Console.WriteLine($"Project request. URL: {request.RawUrl}");
            if(request.RawUrl.Split("/")[^1].Split(".").Length > 1)
            {
                Console.WriteLine("Normal project request.");
                request.SendFile(path+request.RawUrl);
                return;
            }

            request.ResponseHeaders.Add("Content-Type", "text/html;charset=utf-8");
            Console.WriteLine("HTML project request.");

            string url = request.RawUrl;

            if(request.RawUrl.EndsWith('/'))
            {
                url = url.Substring(0, url.Length - 1);
            }
            else{
                request.Redirect(request.RawUrl+"/");
            }

            Console.WriteLine(path+$"{url}/index.html");
            if(File.Exists(path+$"{url}/index.html")){
                request.SendFile(path+$"{url}/index.html");
                Console.WriteLine($"Actual estimated URL: {path}{url}/index.html");
            }
            else
            {
                request.SendFile(path+$"{url}/{url.Split('/')[^1]}.html", DefaultHtmlPath);
                Console.WriteLine($"Actual estimated URL: {path}{url}/{url.Split('/')[^1]}.html");
            }
        }

        private async Task AnswerRequest(WebRequest request)
        {
            if (request.RawUrl.StartsWith("/api"))
            {
                if(Endpoints.TryGetValue(request.RawUrl.Substring(4), out CustomResponse handler))
                {
                    Console.WriteLine($"Using a custom response for {request.RawUrl}");
                    handler(request);
                    return;
                }

                request.RespondWith(404, "Endpoint does not exist.");
                return;
            }

            Console.WriteLine("Tem algo de errado -1");
            string path;
            string fileExtension = request.Url.Split('.')[^1];

            path = @$"{_baseDirectory}/{fileExtension}/{request.RawUrl.Replace("/", "")}";
            if (request.RawUrl == "/")
            {
                path = @$"{_baseDirectory}/html/index.html";
                request.ResponseHeaders.Add("Content-Type", "text/html;charset=utf-8");
                request.ResponseHeaders.Add("Content-Encoding", "UTF-8");
                request.SendFile(path);
                return;
            }

            if (request.RawUrl == "/favicon.ico")
            {
                path = @$"{_baseDirectory}/png/favicon.png";
                request.ResponseHeaders.Add("Content-Type", "image/png;charset=utf-8");
                request.ResponseHeaders.Add("Content-Encoding", "UTF-8");
                request.SendFile(path);
                return;
            }

            Console.WriteLine("Tem algo de errado 2");
            if (MIMETypes.TryGetValue(fileExtension, out string? value))
            {
                request.ResponseHeaders.Add("Content-Type", $"{value};charset=utf-8");
            }
            else
            {
                request.ResponseHeaders.Add("Content-Type", "application/octet-stream;charset=utf-8");
            }
            request.ResponseHeaders.Add("Content-Encoding", "UTF-8");

            // if its a custom project directory
            try{
                if(Projects.Contains(request.RawUrl.Split('/', StringSplitOptions.RemoveEmptyEntries)[0]))
                {
                    // pass control to this function.
                    AnswerProjectsRequest(request);
                    return;
                }
            } catch(Exception ex){
                Console.WriteLine($"Exception: {ex.Message}");
            }

            Console.WriteLine($"Path: {path}");
            if (fileExtension == "html")
            {
                Console.WriteLine($"HTML request. URL: {request.RawUrl}");
                request.SendFile(path, DefaultHtmlPath);
            }
            else
            {
                Console.WriteLine($"Normal request. URL: {request.RawUrl}");
                request.SendFile(path);
            }
        }

        async public Task Start()
        {
            foreach (string URL in URLs)
            {
                server.Prefixes.Add(URL);
            }

            server.Start();
            // debug message
            Console.WriteLine("Server ready and listening.");

            Console.WriteLine(server.IsListening);
            Console.WriteLine(AutoAnswerGetRequests);
            try{
                while(true)
                {
                    HttpListenerContext context = await server.GetContextAsync();

                    Console.WriteLine("======= NEW REQUEST =======");
                    Console.WriteLine("");
                    Console.WriteLine("RawUrl: "+context.Request.RawUrl);
                    Console.WriteLine("URL: "+context.Request.Url?.OriginalString);
                    Console.WriteLine("Method: "+context.Request.HttpMethod);
                    Console.WriteLine("Scheme: "+context.Request.Url.Scheme);
                    Console.WriteLine("");
                    Console.WriteLine("===========================");
                    if(context.Request.HttpMethod != "GET"){
                        context.Response.StatusCode = 503;
                        context.Response.StatusDescription = $"Not implemented the {context.Request.HttpMethod} method yet.";
                        context.Response.OutputStream.Close();
                        Console.WriteLine("We dont support request with other methods than Get.");
                        continue;
                    }

                    AnswerRequest(new WebRequest(context.Request, context.Response));
                    
                }
            }catch(Exception ex){
                Console.WriteLine(ex.Message);
            }
        }

        public void Stop()
        {
            server.Stop();

            // debug message
            Console.WriteLine("Server was stopped.");
        }
    }
}