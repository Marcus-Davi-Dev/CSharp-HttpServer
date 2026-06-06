/*[
    {
        Name: string,
        Description: string,
        FolderPath: string // path to the project
    }
]*/
const projects = await (await fetch("/api/projects")).json();
for(let i = 0; i < projects.length; i++){
    const project = document.createElement("div");
    // project.classList.add("project");
    
    const previewImage = document.createElement("img");
    previewImage.src = `${projects[i].FolderPath}/images/imagePreview.png`;
    previewImage.addEventListener("error", function(){
        // this.onError = null;
        console.log(this);
        this.src = "imagePreview.png";
    })

    const projectName = document.createElement("a");
    projectName.textContent = projects[i].Name;
    projectName.href = projects[i].FolderPath+"/";


    const description = document.createElement("span");
    description.textContent = projects[i].Description;

    project.appendChild(previewImage);
    project.appendChild(projectName);
    project.appendChild(description);
    document.querySelector("#projects-list").appendChild(project);
}