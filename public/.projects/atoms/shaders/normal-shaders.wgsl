struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

@group(0) @binding(1) var<uniform> perspective : mat4x4f;
@group(0) @binding(2) var<uniform> toPixel : mat4x4f;
@group(0) @binding(3) var<uniform> view : mat4x4f; // camera matrix

@vertex
fn vertex_main(@location(0) position: vec4f,
               @location(1) color: vec4f) -> VertexOut
{
  var output : VertexOut;
  output.position = toPixel * view * perspective * position;
  output.color = color;
  return output;
}

@group(0) @binding(0) var<storage, read> vertexesPos : array<f32>;

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  for(var i = 0; i < 32; i+=4){
    if(vertexesPos[i] == round(fragData.position.x) && vertexesPos[i + 1] == round(fragData.position.y)){
      return vec4f(0, 1, 0, 1);
    }
  }
  return fragData.color;
}