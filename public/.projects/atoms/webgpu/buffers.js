import { device } from "./../globals.js";

/**
 * @param {Number[]} values The list of values that the buffer will contain.
 * @param {GPUBufferUsageFlags} usage The usage flags of the buffer.
*/
export function createBuffer(values, usage){
    const array = new Float32Array(values);
    const buffer = device.createBuffer({
        size: array.byteLength,
        usage: usage
    });
    device.queue.writeBuffer(buffer, 0, array, 0, array.length);
    return buffer;
}
// export function createVertexBuffer(values, usage){
//     const array = new Float32Array(values);
//     const buffer = device.createBuffer({
//         size: array.byteLength,
//         usage: usage
//     });
//     device.queue.writeBuffer(buffer, 0, array, 0, array.length);
//     return buffer;
// }