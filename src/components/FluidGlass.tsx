"use client";

import * as THREE from 'three';
import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, MeshTransmissionMaterial, Environment } from '@react-three/drei';

interface FluidGlassProps {
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
}

function GlassModel({
  scale = 1,
  ior = 1.15,
  thickness = 10,
  chromaticAberration = 0.1,
  anisotropy = 0.01,
  transmission = 1,
  roughness = 0,
  color = '#ffffff',
  attenuationColor = '#ffffff',
  attenuationDistance = 0.25,
}: FluidGlassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, pointer } = useThree();
  const { nodes } = useGLTF('/bar.glb') as any;
  
  useFrame(() => {
    if (!meshRef.current) return;
    const targetX = pointer.x * 0.1;
    const targetY = pointer.y * 0.1;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetY, 0.05);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetX, 0.05);
  });

  const viewportWidth = viewport.width;
  const desiredScale = (viewportWidth * 0.8) * scale;

  return (
    <mesh
      ref={meshRef}
      geometry={nodes?.Cube?.geometry || nodes?.bar?.geometry || nodes?.Scene?.children[0]?.geometry}
      scale={desiredScale}
      rotation={[0, 0, 0]}
      position={[0, 0, 0]}
    >
      <MeshTransmissionMaterial
        ior={ior}
        thickness={thickness}
        chromaticAberration={chromaticAberration}
        anisotropy={anisotropy}
        transmission={transmission}
        roughness={roughness}
        color={color}
        attenuationColor={attenuationColor}
        attenuationDistance={attenuationDistance}
        backside
      />
    </mesh>
  );
}

function Scene(props: FluidGlassProps) {
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, -5, -5]} intensity={1} color="#e8e8ff" />
      <pointLight position={[0, 0, 10]} intensity={0.8} />
      
      <Suspense fallback={null}>
        <GlassModel {...props} />
      </Suspense>
    </>
  );
}

export default function FluidGlass(props: FluidGlassProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
      }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <Scene {...props} />
    </Canvas>
  );
}

useGLTF.preload('/bar.glb');
