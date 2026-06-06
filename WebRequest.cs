using System;
using System.Net;

namespace WebServer;

public class WebRequest(HttpListenerRequest request, HttpListenerResponse response)
{
    private HttpListenerRequest _request = request;
    private HttpListenerResponse _response = response;
    public string? Url = request.Url?.OriginalString;
    public string? RawUrl = request.RawUrl;
    public Uri? UrlData = request.Url;
    public bool? IsFile = request.Url?.IsFile;
    public System.Collections.Specialized.NameValueCollection ResponseHeaders = response.Headers;
    public System.Collections.Specialized.NameValueCollection RequestHeaders = request.Headers;

    public void SendFile(string filePath){
        Console.WriteLine("Started sending the file with path: "+filePath);
        string[] dirs = filePath.Split("/");
        string fileName = dirs[^1];
        // string fileExtension = fileName.Split(".")[fileName.Split(".").Length - 1];
        try
        {
            byte[] fileContent;
            using (FileStream stream = File.Open(filePath, FileMode.Open))
            {
                Stream output = _response.OutputStream;
                _response.ContentLength64 = (int)stream.Length;
                int byteCount = Math.Min(2048, (int)stream.Length);
                int bytesLeftToRead = (int)stream.Length;

                fileContent = new byte[byteCount];
                int bytesRead = stream.Read(fileContent, 0, byteCount);

                while (bytesRead > 0)
                {
                    Console.WriteLine($"Bytes left to read: {bytesLeftToRead}");
                    output.Write(fileContent, 0, bytesRead);

                    bytesLeftToRead -= bytesRead;
                    bytesRead = stream.Read(fileContent, 0, Math.Min(byteCount, bytesLeftToRead));
                }
            }
            _response.StatusCode = 200;
        }
        catch (FileNotFoundException)
        {
            _response.StatusCode = 404;
            _response.StatusDescription = "File not found.";
            Console.WriteLine($"Arquivo na URL {filePath} não achado/existe. Cód: 404");
        }
        catch (DirectoryNotFoundException exception)
        {
            _response.StatusCode = 404;
            _response.StatusDescription = $"Directory not found: {exception.Message}";
        }
        catch(Exception ex){
            Console.WriteLine("THE FUCK?");
            Console.WriteLine($"{ex.Message}");
        }
        finally
        {
            _response.OutputStream.Close();
            Console.WriteLine("Ended sending the file.");
        }
    }

    public void SendFile(string filePath, string fallback)
    {
        string[] dirs = filePath.Split("/");
        string fileName = dirs[^1];
        // string fileExtension = fileName.Split(".")[fileName.Split(".").Length - 1];
        Console.WriteLine("Not normal. Fallback.");
        try
        {
            byte[] fileContent;
            using (FileStream stream = File.Open(filePath, FileMode.Open))
            {
                Stream output = _response.OutputStream;
                _response.ContentLength64 = (int)stream.Length;
                int byteCount = Math.Min(2048, (int)stream.Length);
                int bytesLeftToRead = (int)stream.Length;

                //Console.WriteLine($"Stream length: {(int)stream.Length}");
                //Console.WriteLine($"Byte count: {byteCount}");
                //Console.WriteLine($"Content length: {sendTo.ContentLength64}");

                fileContent = new byte[byteCount];
                int bytesRead = stream.Read(fileContent, 0, byteCount);

                while (bytesRead > 0)
                {
                    Console.WriteLine($"Bytes left to read: {bytesLeftToRead}");
                    output.Write(fileContent, 0, bytesRead);

                    bytesLeftToRead -= bytesRead;
                    bytesRead = stream.Read(fileContent, 0, Math.Min(byteCount, bytesLeftToRead));
                }
            }
            _response.StatusCode = 200;
        }
        catch (FileNotFoundException)
        {
            _response.StatusCode = 404;
            _response.StatusDescription = "File not found.";
            Console.WriteLine($"Arquivo na URL {filePath} não achado/existe. Cód: 404");
            byte[] fileContent;
            using (FileStream stream = File.Open(fallback, FileMode.Open))
            {
                Stream output = _response.OutputStream;
                _response.ContentLength64 = (int)stream.Length;
                int byteCount = Math.Min(2048, (int)stream.Length);
                int bytesLeftToRead = (int)stream.Length;

                fileContent = new byte[byteCount];
                int bytesRead = stream.Read(fileContent, 0, byteCount);

                while (bytesRead > 0)
                {
                    Console.WriteLine($"Bytes left to read: {bytesLeftToRead}");
                    output.Write(fileContent, 0, bytesRead);

                    bytesLeftToRead -= bytesRead;
                    bytesRead = stream.Read(fileContent, 0, Math.Min(byteCount, bytesLeftToRead));
                }
            }
            Console.WriteLine(@$"Fallback enviado: {fallback}");
        }
        catch (DirectoryNotFoundException exception)
        {
            _response.StatusCode = 404;
            _response.StatusDescription = $"Directory not found: {exception.Message}";
            byte[] fileContent;
            using (FileStream stream = File.Open(fallback, FileMode.Open))
            {
                Stream output = _response.OutputStream;
                _response.ContentLength64 = (int)stream.Length;
                int byteCount = Math.Min(2048, (int)stream.Length);
                int bytesLeftToRead = (int)stream.Length;

                fileContent = new byte[byteCount];
                int bytesRead = stream.Read(fileContent, 0, byteCount);

                while (bytesRead > 0)
                {
                    Console.WriteLine($"Bytes left to read: {bytesLeftToRead}");
                    output.Write(fileContent, 0, bytesRead);

                    bytesLeftToRead -= bytesRead;
                    bytesRead = stream.Read(fileContent, 0, Math.Min(byteCount, bytesLeftToRead));
                }
            }
            Console.WriteLine(@$"Fallback enviado: {fallback}");
        }
        finally
        {
            _response.OutputStream.Close();
        }

    }
    
    public void SendRawData(byte[] data)
    {
        _response.OutputStream.Write(data);
        _response.OutputStream.Close();
    }

    public void Redirect(string url)
    {
        _response.Redirect(url);
        _response.OutputStream.Close();
    }

    public void RespondWith(int statusCode, string message){
        _response.StatusCode = statusCode;
        _response.StatusDescription = message;
        _response.OutputStream.Close();
    }

    public void RespondWith(int statusCode, string message, byte[] responseBody){
        _response.StatusCode = statusCode;
        _response.StatusDescription = message;
        SendRawData(responseBody);
    }
}