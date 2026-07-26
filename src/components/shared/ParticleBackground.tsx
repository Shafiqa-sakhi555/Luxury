"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

function CraftOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#BE123C" wireframe transparent opacity={0.1} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial color="#0891B2" wireframe transparent opacity={0.06} />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#F59E0B" />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#BE123C" />
      <Stars radius={50} depth={50} count={600} factor={2} saturation={0} fade speed={0.4} />
      <CraftOrb />
    </>
  );
}

export function ParticleBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-30 sm:opacity-35">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
