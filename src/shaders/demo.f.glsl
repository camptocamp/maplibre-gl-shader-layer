precision highp float;
precision highp int;

varying vec3 vPosition;

void main()	{
	gl_FragColor = vec4(vPosition.x, 0., vPosition.y, 0.6);
}