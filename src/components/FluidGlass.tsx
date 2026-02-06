"use client";

import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
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
  depth = 0.4,
  scale = 1,
  ior = 1.5,
  thickness = 8,
  chromaticAberration = 0.15,
  anisotropy = 0.1,
  transmission = 0.98,
  roughness = 0.05,
  color = '#ffffff',
  attenuationColor = '#ffffff',
  attenuationDistance = 1.5,
  distortion = 0.2,
  distortionScale = 0.5,
  temporalDistortion = 0.1,
  followPointer = true,
}: FluidGlassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, pointer } = useThree();

  useFrame(() => {
    if (!meshRef.current || !followPointer) return;
    
    const targetX = pointer.x * 0.15;
    const targetY = pointer.y * 0.15;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetY, 0.08);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetX, 0.08);
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[width, height, depth]}
      radius={0.15}
      smoothness={4}
      scale={scale}
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
        distortion={distortion}
        distortionScale={distortionScale}
        temporalDistortion={temporalDistortion}
      />
    </RoundedBox>
  );
}

function Background() {
  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color={0xf0f0f0} transparent opacity={0.3} />
    </mesh>
  );
}

export default function FluidGlass(props: FluidGlassProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
      }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['transparent']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#d0d0ff" />
      <pointLight position={[0, 5, 5]} intensity={0.5} />
      <Background />
      <GlassMesh {...props} />
    </Canvas>
  );
}
