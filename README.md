<img src="./images/Web NURBS 1.png"/>
<h2 style="margin:0px; padding:0px;"> Click <a href="https://nicholasdrian.github.io/Web-NURBS/src"> <u>HERE</u> </a> to run Web NURBS </h2>
<h2 style="margin:0px; padding:0px;">Click <a href="https://nicholasdrian.github.io/Web-NURBS/docs/docs.html"> <u>HERE</u> </a> to see the docs. </h2>

## What is it?

Web NURBS is 3D modeling software designed to run in your browser. It uses WebGPU (the successor to WebGL) for a modern and performant GPU workflow. The program is written in about 12k lines of TypeScript and WGSL. 

Web NURBS has a CLI inspired by Rhino, Modal editing inspired by Vim, and a Scene Object Model inspired by the Document Object Model.

Web NURBS is far from complete, and lacking much documentation. That being said it is working well and ready for use!

## Whats to come?

I am currently moving surface sampling to compute shaders and expect significant performance gains (100x give or take). Next, I will move the acceleration structures (Bounding Volume Heirarchies) to the GPU. The goal is to move any serious compute away from JavaScript inorder to acheve buttery smooth rendering. 

I also need to get alpha blending up and running... So stay tuned for transparency, GPU acceleration, and various other improvements!

## What does it look like?
<img src="./images/Web NURBS 3.png"/>
<img src="./images/Web NURBS 2.png"/>
<img src="./images/Web NURBS 4.png"/>

Please Leave a ⭐

Also, please reach out if you are interested in collaboration :)
