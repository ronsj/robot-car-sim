import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Rect, RobotState } from '../types'

function DangerZone({ rect }: { rect: Rect }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[rect.x, 0.02, rect.y]}
    >
      <planeGeometry args={[rect.width, rect.height]} />
      <meshStandardMaterial
        color="#eab308"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  )
}

function BoxObstacle({ rect, color }: { rect: Rect; color: string }) {
  const obstacleHeight = 1
  return (
    <mesh
      position={[rect.x, obstacleHeight / 2, rect.y]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[rect.width, obstacleHeight, rect.height]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Wall({ rect }: { rect: Rect }) {
  const wallHeight = 1.2
  return (
    <mesh
      position={[rect.x, wallHeight / 2, rect.y]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[rect.width, wallHeight, rect.height]} />
      <meshStandardMaterial color="#6b7280" />
    </mesh>
  )
}

function Robot({ robot }: { robot: RobotState }) {
  return (
    <group
      position={[robot.x, 0, robot.y]}
      rotation={[0, -robot.theta, 0]}
    >
      <mesh
        position={[0, 0.2, 0]}
        castShadow
      >
        <boxGeometry args={[0.6, 0.25, 0.4]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh
        position={[0.35, 0.28, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        castShadow
      >
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  )
}

function FollowCamera({ robot }: { robot: RobotState }) {
  const target = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const camera = state.camera
    const offset = new THREE.Vector3(
      -Math.cos(robot.theta) * 4,
      3,
      -Math.sin(robot.theta) * 4
    )
    desired.current.set(robot.x + offset.x, offset.y, robot.y + offset.z)
    target.current.set(robot.x, 0.5, robot.y)

    camera.position.lerp(desired.current, 1 - Math.exp(-4 * delta))
    camera.lookAt(target.current)
  })

  return null
}

interface Scene3DProps {
  robot: RobotState
  world: {
    walls: Rect[]
    obstacles: Rect[]
    dangerZones: Rect[]
    width: number
    height: number
  }
}

export function Scene3D({ robot, world }: Scene3DProps) {
  const halfW = world.width / 2
  const halfH = world.height / 2

  return (
    <>
      <color
        attach="background"
        args={['#0f172a']}
      />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.2}
        castShadow
      />
      <FollowCamera robot={robot} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[world.width, world.height]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      <gridHelper
        args={[world.width, world.width, '#334155', '#1e293b']}
        position={[0, 0.01, 0]}
      />

      {world.walls.map((wall, i) => (
        <Wall
          key={`wall-${i}`}
          rect={wall}
        />
      ))}
      {world.dangerZones.map((zone, i) => (
        <DangerZone
          key={`danger-${i}`}
          rect={zone}
        />
      ))}
      {world.obstacles.map((obs, i) => (
        <BoxObstacle
          key={`obs-${i}`}
          rect={obs}
          color="#ea580c"
        />
      ))}

      <Robot robot={robot} />

      {/* Invisible bounds reference for camera framing */}
      <mesh
        visible={false}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[halfW * 2, 0.1, halfH * 2]} />
      </mesh>
    </>
  )
}
