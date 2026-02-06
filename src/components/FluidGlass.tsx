"use client";

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';
import { easing } from 'maath';

interface FluidGlassProps {
  width?: number;
  height?: number;
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
  children?: React.ReactNode;
}

function GlassCard({
  width = 3.5,
  height = 3.5,
  scale = 1,
  ior = 1.15,
  thickness = 5,
  chromaticAberration = 0.1,
  anisotropy = 0.01,
  transmission = 1,
  roughness = 0,
  color = '#ffffff',
  attenuationColor = '#ffffff',
  attenuationDistance = 0.25,
  distortion = 0.5,
  distortionScale = 0.5,
  temporalDistortion = 0.1,
  followPointer = true,
  children,
}: FluidGlassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { pointer, viewport } = useThree();

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(width, height, 0.5, 32, 32, 1);
  }, [width, height]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (followPointer) {
      const targetX = pointer.x * 0.3;
      const targetY = pointer.y * 0.3;
      meshRef.current.rotation.x += (targetY * 0.5 - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (targetX * 0.5 - meshRef.current.rotation.y) * 0.1;
      meshRef.current.position.x += (targetX * 0.5 - meshRef.current.position.x) * 0.1;
      meshRef.current.position.y += (targetY * 0.5 - meshRef.current.position.y) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={scale} geometry={geometry}>
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
        background={new THREE.Color(0xffffff)}
      />
      {children}
    </mesh>
  );
}

function GlassScene(props: FluidGlassProps) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#a0a0ff" />
      <GlassCard {...props} />
    </>
  );
}

export default function FluidGlass({
  width = 3.5,
  height = 3.5,
  scale = 1,
  ior = 1.15,
  thickness = 5,
  chromaticAberration = 0.1,
  anisotropy = 0.01,
  transmission = 1,
  roughness = 0,
  color = '#ffffff',
  attenuationColor = '#ffffff',
  attenuationDistance = 0.25,
  distortion = 0.5,
  distortionScale = 0.5,
  temporalDistortion = 0.1,
  followPointer = true,
  children,
}: FluidGlassProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <GlassScene
        width={width}
        height={height}
        scale={scale}
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
        followPointer={followPointer}
      />
      {children}
    </Canvas>
  );
}
