import { mat4, vec3, Mat4, Vec3 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { OperatingMode } from "../mode"

export class Camera {

    private viewProj: Float32Array;
	private lastFrameTime: number;
	private isTurningRight: boolean = false;
	private isTurningLeft: boolean = false;
	private isMovingForward: boolean = false;
	private isMovingBackward: boolean = false;
	private isLookingUp: boolean = false;
	private isLookingDown: boolean  = false;
	private isMovingLeft: boolean = false;
	private isMovingRight: boolean = false;

	constructor(
		private position: Vec3,
		private up: Vec3,
		private forward: Vec3,
		private fovy: number,
		private screen: HTMLCanvasElement)
	{
		this.up = vec3.normalize(this.up);
		this.lastFrameTime = performance.now();
	    this.viewProj = new Float32Array(16);
		this.addEvents();
	}

	getViewProj() : Float32Array {
		return this.viewProj;
	}

	getPosition(): Vec3 {
		return this.position;
	}

    private addEvents() {

		document.addEventListener('keydown', (event) => {
	  		switch (event.code) {
  			case 'ArrowLeft':	this.isTurningLeft = true; break;
  			case 'ArrowRight':	this.isTurningRight = true; break;
  			case 'ArrowUp':		this.isLookingUp = true; break;
  			case 'ArrowDown':	this.isLookingDown = true; break;
  			case 'KeyW':		this.isMovingForward = true; break;
  			case 'KeyS':		this.isMovingBackward = true; break;
			case 'KeyA' :		this.isMovingLeft = true; break;
			case 'KeyD' :		this.isMovingRight = true; break;
	  		}
  		}, false);

  		document.addEventListener('keyup', (event) => {
	  		switch (event.code) {
  			case 'ArrowLeft':	this.isTurningLeft = false; break;
  			case 'ArrowRight':	this.isTurningRight = false; break;
	  		case 'ArrowUp':		this.isLookingUp = false; 	break;
  			case 'ArrowDown':	this.isLookingDown = false; break;
  			case 'KeyW':		this.isMovingForward = false; break;
  			case 'KeyS':		this.isMovingBackward = false; break;
			case 'KeyA':		this.isMovingLeft = false; break;
			case 'KeyD':		this.isMovingRight = false; break;
	  		}
  		}, false);

	}


	tick(): void {


		var now : number = performance.now();

        if (INSTANCE.getMode() == OperatingMode.Navigation) {
            if (this.isTurningLeft) {
                this.turnRight((this.lastFrameTime - now) / 500);
            } else if (this.isTurningRight == true) {
                this.turnRight((now - this.lastFrameTime) / 500);
            }

            if (this.isLookingUp) {
                this.lookUp((now - this.lastFrameTime) / 500);
            } else if (this.isLookingDown) {
                this.lookUp((this.lastFrameTime - now) / 500);
            }

            if (this.isMovingForward) {
                this.goForward((now - this.lastFrameTime) / 100);
            } else if (this.isMovingBackward) {
                this.goForward((this.lastFrameTime - now) / 100);
            }

            if (this.isMovingRight) {
                this.goRight((now - this.lastFrameTime) / 100);
            } else if (this.isMovingLeft) {
                this.goRight((this.lastFrameTime - now) / 100);
            }
            this.updateViewProj();
        }

		this.lastFrameTime = now;
	}

	private turnRight(amount: number): void {
		const rotation : Mat4 = mat4.rotateY(mat4.identity(), -amount);
		this.forward = vec3.transformMat4(this.forward, rotation);
		this.up = vec3.transformMat4(this.up, rotation);
	}
	private lookUp(amount: number): void{
		const right : Vec3 = vec3.cross(this.forward, this.up);
		const rotation : Mat4 = mat4.axisRotate(mat4.identity(), right, amount);
		this.forward = vec3.transformMat4(this.forward, rotation);
		this.up = vec3.transformMat4(this.up, rotation);
	}

	private goForward(amount: number): void {
		this.position = vec3.add(vec3.scale(this.forward, amount), this.position);
	}

	private goRight(amount: number): void {
		const right : Vec3 = vec3.cross(this.forward, this.up);
		this.position = vec3.add(this.position, vec3.scale(right, amount));
	}

    private updateViewProj() {
		const view = new Float32Array(16);
		const proj = new Float32Array(16);
		mat4.lookAt(this.position, vec3.add(this.position, this.forward), this.up, view);
		mat4.perspective(this.fovy, this.screen.width / this.screen.height, 0.1, 1000.0, proj);
		mat4.multiply(proj, view, this.viewProj);
    }


}
