import { device } from "../globals.js";

export class BindLayout {
    constructor(label) {
        this.layout = {
            label: label,
            entries: []
        };
        /**
         * @type {{
         *   binding: number,
         *   size: number,
         *   resource: {buffer: GPUBuffer}
         * }[]}
        */
        this.buffers = [];
    }

    addBuffer(buffer, bufferType, shaderStage, binding, bufferSize) {
        this.layout.entries.push({
            binding: binding,
            visibility: shaderStage,
            buffer: { type: bufferType }
        });

        this.buffers.push({
            binding: binding,
            size: bufferSize,
            resource: { buffer: buffer }
        })
    }
    createDescriptor() {
        return {
            label: this.layout.label,
            layout: this.layout,
            entries: this.buffers
        };
    }

    createBindGroup(){
        return device.createBindGroup(this.createDescriptor());
    }
}