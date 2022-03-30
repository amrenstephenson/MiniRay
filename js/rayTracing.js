// rayTracing.js is the entrypoint to the raytracing code. It will be separate from canvasRenderer.js as that will allow it to be used with ascii renderers etc.

import { Scene } from './scene.js';
import { SphereObject } from './sphereObject.js';
import { Vector } from './vector.js';
import { Camera } from './camera.js';
import { Matrix } from './matrix.js';
import { DirectionalLight, PointLight } from './Light.js';
import { ColorVector } from './colorVector.js';

export class RayTracing {
	constructor (buffer, width, height) {
		this.buffer = buffer;
		this.width = width;
		this.height = height;
		this.black = new ColorVector(0, 0, 0);

		// create our scene
		this.createScene();

		// render:
		this.renderScene();
	}

	raycast (origin, direction) {
		let closest = null;
		for (const obj of this.scene.objects) {
			const hit = obj.rayIntersection({ origin: origin, direction: direction });
			if (hit && (closest === null || hit.hits[0].distance < closest.hits[0].distance)) {
				closest = hit;
			}
		}
		return closest;
	}

	computeLight (point, surfaceNorm) {
		let totalIllum = 0;
		let contribution = 0;
		let VectToLight = Vector.zero;
		// Check how much light every scene light contributes to the point
		for (const light of this.scene.lights) {
			VectToLight = (light instanceof PointLight) ? light.pos.sub(point) : light.dir;
			contribution = (light.intensity * surfaceNorm.dot(VectToLight)) / (VectToLight.magnitude);
			if (contribution > 0) {
				totalIllum += contribution;
			}
		}
		return totalIllum;
	}

	renderScene () {
		const cameraPos = this.camera.pos;
		this.camera.iterateDirectionVectors(this.width, this.height, (x, y, dir) => {
			const hit = this.raycast(cameraPos, dir);

			// DEBUG code for coloring the spheres. This is wrong, we should be treating the camera as a light source and using distance etc etc:
			if (hit) {
				// Assuming all light is white and that distance does not affect light sensitivity

				// Index 0 always has the lowest distance, subtracts discriminant
				const surfaceNorm = hit.hits[0].point.sub(hit.object.pos).normalized();
				const illum = this.computeLight(hit.hits[0].point, surfaceNorm);

				this.buffer[y * this.width + x] = (hit.object.color.mul(illum)).getReverseHexColor();
			} else { this.buffer[y * this.width + x] = this.black.getReverseHexColor(); }
		});
	}

	createScene () {
		this.scene = new Scene();
		const sphere1 = new SphereObject(new Vector(3, 0, -0.5), 0.5, new ColorVector(255, 0, 255));
		const sphere2 = new SphereObject(new Vector(3, 0.5, 1), 0.5, new ColorVector(0, 255, 0));
		const sphere3 = new SphereObject(new Vector(3, 1, -0.5), 0.5, new ColorVector(0, 0, 255));
		const sphere4 = new SphereObject(new Vector(10, -10, 0), 10, new ColorVector(0, 0, 255));
		const light1 = new PointLight(new Vector(3, 0, -1.5), 0.5);
		const light2 = new DirectionalLight(new Vector(0, 0, 1), 1);
		this.scene.addObject(sphere1);
		this.scene.addObject(sphere2);
		this.scene.addObject(sphere3);
		this.scene.addObject(sphere4);
		this.scene.addLight(light1);
		this.scene.addLight(light2);
		const FOV = (60 / 360) * 2 * Math.PI;
		this.camera = new Camera(Vector.zero, Matrix.xRotation(Math.PI / 2), FOV);
	}
}
