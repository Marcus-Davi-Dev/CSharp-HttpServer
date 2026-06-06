/*let atoms = 0;
let logInfo = false;

class Atom {
	constructor(x, y, size, color = "rgb(0, 0, 0)") {
		this.x = x;
		this.y = y;
		this.velX = 0;
		this.velY = 0;
		this.size = size;
		this.color = color;
		this.name = atoms;
		atoms++;
	}

	calculateAttraction(other) {
		const attraction = { x: 0, y: 0 };
		const distanceX = other.x - this.x;
		const distanceY = other.y - this.y;

		// change to use Math.sign
		// if (Math.abs(distanceX) < 1 && Math.abs(distanceY) < 1) {
		// 	if(Math.min(1, Math.abs(other.velX)) === Math.abs(other.velX)){
		// 		other.velX = other.velX;
		// 	}else{
		// 		other.velX = 1;
		// 	}
		// 	if(Math.min(1, Math.abs(other.velY)) === Math.abs(other.velY)){
		// 		other.velY = other.velY;
		// 	}else{
		// 		other.velY = 1;
		// 	}

		// 	return attraction;
		// }

		const softening = 10;
		const distance = Math.sqrt(softening + distanceX ** 2 + distanceY ** 2);

		const massProduct = (this.size * this.size) * (other.size * other.size);
		const magnitude = massProduct / (distance ** 2);

		attraction.x = magnitude * (distanceX / distance);
		attraction.y = magnitude * (distanceY / distance);

		return attraction;
	}

	toString() {
		let string = "";
		for (let i = 0; i < Object.keys(this).length; i++) {
			string += `\n\t${Object.keys(this)[i]}: ${this[Object.keys(this)[i]]}`;
		}
		return `{${string}\n}`;
	}
}


let id;
const ctx = document.querySelector("canvas").getContext("2d");
const ATOMS = [new Atom(0, 0, 1.5, "rgb(255, 0, 0)"), new Atom(10, 10, 1.5, "rgb(0, 255, 100)")];

function render() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	for (let i = 0; i < ATOMS.length; i++) {
		log("group", `ATOMS[${i}]`);
		log("log", ATOMS[i].toString());
		for (let j = 0; j < ATOMS.length; j++) {
			if (i === j) {
				continue;
			}

			log("group", `ATOMS[${j}]`);
			ATOMS[i].velX += ATOMS[i].calculateAttraction(ATOMS[j]).x;
			log("log", ATOMS[i].calculateAttraction(ATOMS[j]).x);
			ATOMS[i].velY += ATOMS[i].calculateAttraction(ATOMS[j]).y;
			log("log", ATOMS[i].calculateAttraction(ATOMS[j]).y);
			log("groupEnd");

			if(ATOMS[i].x === ATOMS[j].x && ATOMS[i].y === ATOMS[j].y){
				ATOMS[i]
			}
		}

		if (ATOMS[i].x > ctx.canvas.width || ATOMS[i].x < 0) {
			ATOMS[i].velX *= -1;
		}
		if (ATOMS[i].y > ctx.canvas.height || ATOMS[i].y < 0) {
			ATOMS[i].velY *= -1;
		}
		log("log", `Velocidade X: ${ATOMS[i].velX}`);
		log("log", `Velocidade Y: ${ATOMS[i].velY}`);
		ATOMS[i].x += ATOMS[i].velX;
		ATOMS[i].y += ATOMS[i].velY;

		ctx.beginPath();
		ctx.strokeStyle = ATOMS[i].color;
		ctx.rect(ATOMS[i].x, ATOMS[i].y, ATOMS[i].size, ATOMS[i].size);
		ctx.stroke();
		console.groupEnd();
	}

	id = requestAnimationFrame(render);
}

// setTimeout(() => {cancelAnimationFrame(id)}, 500);
render();

function log(type, ...data) {
	if (logInfo) {
		console[type](data);
	}
}*/

import { device } from "./globals.js";
import { crossProduct, subtractVectors, normalizeVector } from "./vector.js";
import { createBuffer } from "./webgpu/buffers.js";
import { BindLayout } from "./webgpu/bindGroup.js";

const canvas = document.querySelector("canvas");
if (!navigator.gpu) {
	console.log("Seu navegador não suporta WebGPU.");
}
const webgpu = canvas.getContext("webgpu");
window.webgpuC = webgpu;
const PIPELINE_TYPES = ["normal", "circle"];
const BIND_GROUP_LAYOUTS = {
	"normal": new BindLayout("normal"),
	"circle": new BindLayout("circle")
};
// the bind group layouts when they are created
const ACTUAL_BIND_GROUP_LAYOUTS = {};

const pipelines = {};

webgpu.configure({
	device,
	format: navigator.gpu.getPreferredCanvasFormat(),
	alphaMode: "premultiplied"
});

const depthTexture = device.createTexture({
	size: [canvas.width, canvas.height],
	format: "depth24plus",
	usage: GPUTextureUsage.RENDER_ATTACHMENT
});

/**
 * @param {DOMMatrix} matrix
*/
function getMatrixValues(matrix) {
	if (matrix.is2D) {
		const { a, b, c, d, e, f } = matrix;
		return [
			a, d,
			b, e,
			c, f
		];
	}

	const { m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44 } = matrix;
	return [
		// Coluna 1
		m11, m12, m13, m14,
		// Coluna 2
		m21, m22, m23, m24,
		// Coluna 3
		m31, m32, m33, m34,
		// Coluna 4
		m41, m42, m43, m44
	];
}

/**
 * Cria uma matriz "View" (Visão) que "olha" de um ponto (eye)
 * para outro (target).
 */
function lookAt(eye, target, up) {
	const zAxis = normalizeVector(subtractVectors(target, eye));
	const xAxis = normalizeVector(crossProduct(up, zAxis));
	const yAxis = normalizeVector(crossProduct(zAxis, xAxis));

	// Retorna uma DOMMatrix em ordem de COLUNA
	// (Esta é a matriz de visão "invertida")
	return new DOMMatrix([
		xAxis[0], yAxis[0], zAxis[0], 0,
		xAxis[1], yAxis[1], zAxis[1], 0,
		xAxis[2], yAxis[2], zAxis[2], 0,
		-(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]),
		-(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]),
		-(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]),
		1
	]);
}

const orthoWidth = 800;
const orthoHeight = 800;
const orthoNear = 0.1;
const orthoFar = 1000;

const r_l = orthoWidth;
const t_b = orthoHeight;
const f_n = orthoFar - orthoNear;

const pixelMatrix = new DOMMatrix([
	2 / r_l, 0, 0, 0,
	0, -2 / t_b, 0, 0, // Y invertido
	0, 0, 1 / f_n, 0,
	0, 0, -orthoNear / f_n, 1
]);

window.pixel = pixelMatrix;
const pixelMatrixBuffer = createBuffer(getMatrixValues(pixelMatrix), GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM);

for (let i = 0; i < PIPELINE_TYPES.length; i++) {
	async function loadShaderCode(scriptId) {
		return await (await fetch(`./shaders/${scriptId}.wgsl`)).text();
	}

	const shaders = await loadShaderCode(`${PIPELINE_TYPES[i]}-shaders`);
	const shaderModule = device.createShaderModule({
		code: shaders
	});

	const vertexBuffers = [
		{
			attributes: [
				{
					shaderLocation: 0, // position of the vertex
					offset: 0,
					format: "float32x4",
				},
				{
					shaderLocation: 1, // color of the vertex
					offset: 16,
					format: "float32x4",
				},
			],
			arrayStride: 32,
			stepMode: "vertex",
		},
	];

	const bindGroupLayout = device.createBindGroupLayout(BIND_GROUP_LAYOUTS[PIPELINE_TYPES[i]].layout);
	ACTUAL_BIND_GROUP_LAYOUTS[PIPELINE_TYPES[i]] = bindGroupLayout;
	const pipelineLayout = device.createPipelineLayout({
		bindGroupLayouts: [
			bindGroupLayout
		]
	});

	const pipelineDescriptor = {
		label: "normal",
		vertex: {
			module: shaderModule,
			entryPoint: "vertex_main",
			buffers: vertexBuffers,
		},
		fragment: {
			module: shaderModule,
			entryPoint: "fragment_main",
			targets: [
				{
					format: navigator.gpu.getPreferredCanvasFormat(),
				},
			],
		},
		depthStencil: {
			depthWriteEnabled: true,
			depthCompare: "less",
			format: "depth24plus"
		},
		primitive: {
			topology: "triangle-list",
			// stripIndexFormat: "uint16"
		},
		layout: pipelineLayout,
	};

	pipelines[PIPELINE_TYPES[i]] = device.createRenderPipeline(pipelineDescriptor);
}

function normalize(value, normalizer, range = 1.0) {
	return ((value / normalizer) * range - (range / 2)) * 2;
}
function normalizeAbs(value, normalizer, range = 1.0) {
	return (value / normalizer) * range;
}

window.normalize = normalize;

const CUBE_SIZE = 100;
const vertices = new Float32Array([
	//                         pos                  |   color
	250 - CUBE_SIZE / 2, 250 - CUBE_SIZE / 2, 100, 1, 1, 0, 0, 1,
	250 + CUBE_SIZE / 2, 250 - CUBE_SIZE / 2, 100, 1, 1, 0, 0, 1,
	250 + CUBE_SIZE / 2, 250 + CUBE_SIZE / 2, 100, 1, 1, 0, 0, 1,
	250 - CUBE_SIZE / 2, 250 + CUBE_SIZE / 2, 100, 1, 1, 0, 0, 1,
	250 - CUBE_SIZE / 2, 250 - CUBE_SIZE / 2, 25, 1, 0, 0, 1, 1,
	250 + CUBE_SIZE / 2, 250 - CUBE_SIZE / 2, 25, 1, 0, 0, 1, 1,
	250 + CUBE_SIZE / 2, 250 + CUBE_SIZE / 2, 25, 1, 0, 0, 1, 1,
	250 - CUBE_SIZE / 2, 250 + CUBE_SIZE / 2, 25, 1, 0, 0, 1, 1,
]);

const vertexBuffer = createBuffer(vertices, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
window.vertexBuffer = vertexBuffer;

const pos = new Float32Array([
	250 - CUBE_SIZE / 2, 250 - CUBE_SIZE / 2, 1, 1,
	250 + CUBE_SIZE / 2, 250 - CUBE_SIZE / 2, 1, 1,
	250 + CUBE_SIZE / 2, 250 + CUBE_SIZE / 2, 1, 1,
	250 - CUBE_SIZE / 2, 250 + CUBE_SIZE / 2, 1, 1,
	280 - CUBE_SIZE / 2, 220 - CUBE_SIZE / 2, 0.25, 1,
	280 + CUBE_SIZE / 2, 220 - CUBE_SIZE / 2, 0.25, 1,
	280 + CUBE_SIZE / 2, 220 + CUBE_SIZE / 2, 0.25, 1,
	280 - CUBE_SIZE / 2, 220 + CUBE_SIZE / 2, 0.25, 1
]);
const posBuffer = createBuffer(pos, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
BIND_GROUP_LAYOUTS["normal"].addBuffer(posBuffer, "read-only-storage");

const perspectiveMatrix = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
// perspectiveMatrix.rotateAxisAngleSelf(0, 1, 0, 2);
// perspectiveMatrix.translateSelf(-100, 0, 0);
window.matrix = perspectiveMatrix;
console.log(JSON.parse(JSON.stringify(perspectiveMatrix)));

window.up = function (deg) { perspectiveMatrix.rotateAxisAngleSelf(0, 1, 0, deg); };

let perspectiveArray = new Float32Array(getMatrixValues(perspectiveMatrix));

const perspectiveBuffer = device.createBuffer({
	size: perspectiveArray.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(perspectiveBuffer, 0, perspectiveArray, 0, perspectiveArray.length);

let viewMatrix = new DOMMatrix([
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1]);
let viewMatrixArray = new Float32Array(getMatrixValues(viewMatrix));

const viewMatrixBuffer = device.createBuffer({
	size: viewMatrixArray.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

const indexes = new Uint16Array([
	// 2 triangulos para cada face
	// front ok
	0, 1, 3, 1, 2, 3,
	// left ok
	0, 3, 7, 0, 4, 7,
	// right ok
	1, 2, 5, 2, 5, 6,
	// up ok
	0, 1, 4, 1, 4, 5,
	// down ok
	2, 3, 7, 2, 6, 7,
	// back ok
	4, 5, 7, 5, 6, 7,
]);

const indexBuffer = device.createBuffer({
	size: indexes.byteLength,
	usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(indexBuffer, 0, indexes, 0, indexes.length);

// canvas.addEventListener("mousemove", function(ev){
// const SIZE = 50;
// const vertices = quad(ev.offsetX - SIZE / 2, ev.offsetY - SIZE / 2, SIZE, SIZE)[0];
// device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);
// render();
// });

const bindGroup = device.createBindGroup({
	label: "normal bind group",
	layout: ACTUAL_BIND_GROUP_LAYOUTS["normal"],
	entries: [
		{
			binding: 0,
			size: pos.byteLength,
			resource: { buffer: posBuffer }
		},
		{
			binding: 1,
			size: perspectiveArray.byteLength,
			resource: { buffer: perspectiveBuffer }
		},
		{
			binding: 2,
			size: pixelMatrixValues.byteLength,
			resource: { buffer: pixelMatrixBuffer }
		},
		{
			binding: 3,
			size: viewMatrixArray.byteLength,
			resource: { buffer: viewMatrixBuffer }
		}
	]
});

let id;
window.cancel = function () { cancelAnimationFrame(id); };
let past = 0;
// in degrees.
let rotation = 0;
let cameraAngle = 0;

function render(time) {
	const delta = (time ?? 0) - past;
	past = time ?? 0;
	rotation = (rotation + delta / 30) % 360;


	const centerX = 250;
	const centerY = 250;
	const centerZ = (100 + 25) / 2; // 62.5

	perspectiveArray = new Float32Array(getMatrixValues(
		// window.matrix = perspectiveMatrix // perspectiveMatrix é sua matriz identidade inicial
		// (Você pode começar direto da perspectiveMatrix se ela for identidade,
		// ou de new DOMMatrix() se quiser ter certeza)
		window.matrix = new DOMMatrix() // Começa com uma matriz identidade limpa
			.translate(centerX, centerY, centerZ) // 1. Mova o centro (250, 250, 62.5) para a origem (0,0,0)
			.rotateAxisAngle(0, 1, 0, rotation)      // 2. Gire em torno do eixo Y na origem
			.translate(-centerX, -centerY, -centerZ)      // 3. Mova de volta para a posição original (250, 250, 62.5)
	));


	device.queue.writeBuffer(perspectiveBuffer, 0, perspectiveArray, 0, perspectiveArray.length);

	cameraAngle = (cameraAngle + delta / 80) % 360;
	const orbitRadius = 400; // distância da câmera

	// Posilção da câmera (orbitando no eixo XZ)
	const cameraX = Math.sin(cameraAngle * (Math.PI / 180)) * orbitRadius + centerX;
	const cameraZ = Math.cos(cameraAngle * (Math.PI / 180)) * orbitRadius + centerZ;
	const cameraY = 300;

	const eye = [cameraX, cameraY, cameraZ];
	const target = [centerX, centerY, centerZ];
	const up = [0, 1, 0];

	viewMatrix = lookAt(eye, target, up);
	viewMatrixArray = new Float32Array(getMatrixValues(viewMatrix));
	device.queue.writeBuffer(viewMatrixBuffer, 0, viewMatrixArray, 0, viewMatrixArray.length);

	const commandEncoder = device.createCommandEncoder();
	window.encoder = commandEncoder;

	const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };

	const renderPassDescriptor = {
		label: "opa",
		colorAttachments: [
			{
				clearValue: clearColor,
				loadOp: "clear", // load operation.
				storeOp: "store", // store operation.
				view: webgpu.getCurrentTexture().createView(),
			},
		],
		depthStencilAttachment: {
			view: depthTexture.createView(),
			depthClearValue: 1.0,
			depthLoadOp: "clear",
			depthStoreOp: "store"
		}
	};

	const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.setPipeline(pipelines["normal"]);
	passEncoder.setVertexBuffer(0, vertexBuffer);
	passEncoder.setIndexBuffer(indexBuffer, "uint16");
	passEncoder.drawIndexed(indexes.length);
	passEncoder.end();

	device.queue.submit([commandEncoder.finish()]);
	id = requestAnimationFrame(render);
}
window.render = render;
render();
