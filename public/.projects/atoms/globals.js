if(!("gpu" in navigator)){
    throw new Error("Your browser does not support webgpu.");
}
export const adapter = await navigator.gpu.requestAdapter();

if(!adapter){
    throw new Error("Was not able to get an adapter.");
}

export const device = await adapter.requestDevice();

if(!device){
    throw new Error("Was not able to get an device.");
}