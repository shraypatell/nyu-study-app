"use client";

import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';

interface FluidGlassProps {
  width?: number;
  height?: number;
  depth?: number;
  scale?: number;
  ior?: number;
  thickness?: number;
  chromaticAberration?: number;
  anisotropy?: number;
  transmission?: number;
  roughness?: number;
  color?: string;
  attenuationColor?: string;
  attenuationDistance?: number;
  distortion?: number;
  distortionScale?: number;
  temporalDistortion?: number;
  followPointer?: boolean;
}

function GlassMesh({
  width = 3.5,
  height = 3.5,
  depth = 0.5,
  scale = 1,
  ior = 1.5,
  thickness = 10,
  chromaticAberration = 0.2,
  anisotropy = 0.15,
  transmission = 1,
  roughness = 0.05,
  color = '#ffffff',
  attenuationColor = '#ffffff',
  attenuationDistance = 0.5,
  distortion = 0.3,
  distortionScale = 0.4,
  temporalDistortion = 0.1,
  followPointer = true,
}: FluidGlassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gl, viewport, pointer, camera, size } = useThree();
  
  const [bufferScene] = useState(() => new THREE.Scene());
  const [renderTarget, setRenderTarget] = useState<THREE.WebGLRenderTarget | null>(null);

  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(size.width)),
      Math.max(1, Math.floor(size.height)),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );
    setRenderTarget(target);
    
    return () => {
      target.dispose();
    };
  }, [size.width, size.height]);

  useFrame(() => {
    if (!meshRef.current || !renderTarget) return;
    
    if (followPointer) {
      const targetX = pointer.x * 0.2;
      const targetY = pointer.y * 0.2;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetY * 0.5, 0.05);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetX * 0.5, 0.05);
    }

    const currentClearColor = gl.getClearColor(new THREE.Color());
    const currentClearAlpha = gl.getClearAlpha();
    
    const oldXrEnabled = gl.xr.enabled;
    gl.xr.enabled = false;
    
    gl.setRenderTarget(renderTarget);
    gl.setClearColor(0xf0f0f0, 1);
    gl.clear();
    gl.render(bufferScene, camera);
    gl.setRenderTarget(null);
    
    gl.xr.enabled = oldXrEnabled;
    gl.setClearColor(currentClearColor, currentClearAlpha);
  });

  if (!renderTarget) return null;

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
          <meshBasicMaterial color={0xf0f0f0} />
        </mesh>,
        bufferScene
      )}
      <RoundedBox
        ref={meshRef}
        args={[width, height, depth]}
        radius={0.2}
        smoothness={4}
        scale={scale}
      >
        <MeshTransmissionMaterial
          buffer={renderTarget.texture}
          ior={ior}
          thickness={thickness}
          chromaticAberration={chromaticAberration}
          anisotropy={anisotropy}
          transmission={transmission}
          roughness={roughness}
          color={color}
          attenuationColor={attenuationColor}
          attenuationDistance={attenuationDistance}
          distortion={distortion}
          distortionScale={distortionScale}
          temporalDistortion={temporalDistortion}
        />
      </RoundedBox>
    </>
  );
}

export default function FluidGlass(props: FluidGlassProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
      }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#e8e8ff" />
      <pointLight position={[0, 5, 8]} intensity={0.8} />
      <pointLight position={[0, -5, 8]} intensity={0.4} color="#ffe8e8" />
      <GlassMesh {...props} />
    </Canvas>
  );
}
