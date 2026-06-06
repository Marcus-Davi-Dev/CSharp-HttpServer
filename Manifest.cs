using System;
using System.Collections.Generic;

namespace WebServer;

class Manifest {
    public struct Icon {
        public string sizes {get; set;}
        public string src {get; set;}
        public string types {get; set;}
    }
    public required string display {get; set;}
    public string? background_color {get; set;}
    public required string name {get; set;}
    public required string short_name {get; set;}
    public required string start_url {get; set;}
    public string? theme_color {get; set;}
    public string? description {get; set;}
    public required List<Icon> icons {get; set;}
}