/**
 * 3D geometry definitions
 * 23 different geometric primitives for the visualizer
 * @module materials/geometries
 */

import * as THREE from 'three';
import type { Material } from '@types';
import { MATERIAL_CONFIG } from '@constants/config';

// Geometry cache to prevent recreating geometries
const geometryCache: Map<string, THREE.BufferGeometry> = new Map();

// For performance, we should share the same geometry instance if we don't modify vertices
// Most geometries here are static, so we can return the reference directly
function getSharedGeometry(key: string, creator: () => THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geometryCache.has(key)) {
    geometryCache.set(key, creator());
  }
  return geometryCache.get(key)!;
}


export const MATERIALS: Material[] = [
  {
    id: 'mat1',
    name: 'Bar',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('box_0.3_3_0.3', () => new THREE.BoxGeometry(0.3, 3, 0.3));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color: MATERIAL_CONFIG.SOLID_COLOR,
          roughness: MATERIAL_CONFIG.SOLID_ROUGHNESS,
          metalness: MATERIAL_CONFIG.SOLID_METALNESS
        }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
          color: MATERIAL_CONFIG.WIREFRAME_COLOR
        }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.01, 0.01), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat2',
    name: 'Cube',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('box_2_2_2', () => new THREE.BoxGeometry(2, 2, 2));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.008), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat3',
    name: 'Sphere',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('sphere_1.5_32_32', () => new THREE.SphereGeometry(1.5, 32, 32));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 10);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.012, 0.015, 0.01), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat4',
    name: 'Torus',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('torus_1.2_0.4_16_32', () => new THREE.TorusGeometry(1.2, 0.4, 16, 32));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 15);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.012, 0.015), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat5',
    name: 'Cone',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('cone_1_2.5_16_1', () => new THREE.ConeGeometry(1, 2.5, 16, 1));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.018, 0.01, 0.012), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat6',
    name: 'Cylinder',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('cylinder_0.8_0.8_2.5_16_1', () => new THREE.CylinderGeometry(0.8, 0.8, 2.5, 16, 1));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.014, 0.009), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat7',
    name: 'Octahedron',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('octahedron_1.5_0', () => new THREE.OctahedronGeometry(1.5, 0));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.013, 0.01, 0.016), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat8',
    name: 'Tetrahedron',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('tetrahedron_1.8_0', () => new THREE.TetrahedronGeometry(1.8, 0));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.015, 0.012, 0.01), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat9',
    name: 'Dodecahedron',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('dodecahedron_1.3_0', () => new THREE.DodecahedronGeometry(1.3, 0));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.016, 0.013), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat10',
    name: 'Icosahedron',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('icosahedron_1.4_0', () => new THREE.IcosahedronGeometry(1.4, 0));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.011), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat11',
    name: 'TorusKnot',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('torusknot_0.8_0.3_64_8', () => new THREE.TorusKnotGeometry(0.8, 0.3, 64, 8));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 15);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.013, 0.015), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat12',
    name: 'Ring',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('ring_0.8_1.5_16', () => new THREE.RingGeometry(0.8, 1.5, 16));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.012, 0.01, 0.014), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat13',
    name: 'Prism',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('prism_1.2_1.2_2_6_1', () => new THREE.CylinderGeometry(1.2, 1.2, 2, 6, 1));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.015, 0.013), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat15',
    name: 'Plane',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('plane_2.5_2.5_1_1', () => new THREE.PlaneGeometry(2.5, 2.5, 1, 1));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR, side: THREE.DoubleSide }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.013, 0.01, 0.017), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat16',
    name: 'Thin Torus',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('torus_1.5_0.2_16_32', () => new THREE.TorusGeometry(1.5, 0.2, 16, 32));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 15);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.018, 0.011), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat17',
    name: 'Wide Box',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('box_3_0.5_1.5', () => new THREE.BoxGeometry(3, 0.5, 1.5));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.012), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat18',
    name: 'Tall Cone',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('cone_0.8_3.5_8', () => new THREE.ConeGeometry(0.8, 3.5, 8));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.012, 0.016), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat19',
    name: 'Small Sphere',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('sphere_1_12_12', () => new THREE.SphereGeometry(1, 12, 12));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.017, 0.01, 0.014), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat20',
    name: 'Double Torus',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const geo = getSharedGeometry('torus_1_0.3_16_32', () => new THREE.TorusGeometry(1, 0.3, 16, 32));
      // Reuse same geometry for both rings!

      if (isSolid) {
        const mesh1 = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        mesh1.userData.originalGeo = geo;

        const mesh2 = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        mesh2.rotation.x = Math.PI / 2;
        mesh2.userData.originalGeo = geo;

        group.add(mesh1);
        group.add(mesh2);
      } else {
        const edges = getSharedGeometry('torus_1_0.3_16_32_edges', () => new THREE.EdgesGeometry(geo, 15));
        const mesh1 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        mesh1.userData.originalGeo = geo;

        const mesh2 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        mesh2.rotation.x = Math.PI / 2;
        mesh2.userData.originalGeo = geo;

        group.add(mesh1);
        group.add(mesh2);
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.014, 0.012) };
      return group;
    }
  },
  {
    id: 'mat21',
    name: 'Star',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('octahedron_1.8', () => new THREE.OctahedronGeometry(1.8));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.rotation.x = Math.PI / 4;
      mesh.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.013), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat22',
    name: 'Cross',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const geo = getSharedGeometry('box_0.4_2.5_0.4', () => new THREE.BoxGeometry(0.4, 2.5, 0.4));

      if (isSolid) {
        const mesh1 = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        mesh1.userData.originalGeo = geo;

        const mesh2 = new THREE.Mesh(geo.clone(), new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        mesh2.rotation.z = Math.PI / 2;
        mesh2.userData.originalGeo = geo;

        const mesh3 = new THREE.Mesh(geo.clone(), new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        mesh3.rotation.x = Math.PI / 2;
        mesh3.userData.originalGeo = geo;

        group.add(mesh1);
        group.add(mesh2);
        group.add(mesh3);
      } else {
        const edges1 = new THREE.EdgesGeometry(geo);
        const mesh1 = new THREE.LineSegments(edges1, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        mesh1.userData.originalGeo = geo;

        const edges2 = new THREE.EdgesGeometry(geo);
        const mesh2 = new THREE.LineSegments(edges2, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        mesh2.rotation.z = Math.PI / 2;
        mesh2.userData.originalGeo = geo;

        const edges3 = new THREE.EdgesGeometry(geo);
        const mesh3 = new THREE.LineSegments(edges3, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        mesh3.rotation.x = Math.PI / 2;
        mesh3.userData.originalGeo = geo;

        group.add(mesh1);
        group.add(mesh2);
        group.add(mesh3);
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.013, 0.015) };
      return group;
    }
  },
  {
    id: 'mat23',
    name: 'Diamond',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('octahedron_1.6', () => new THREE.OctahedronGeometry(1.6));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.scale.y = 1.5;
      mesh.userData = { vel: new THREE.Vector3(0.012, 0.01, 0.016), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat24',
    name: 'Helix',
    create3D: (isSolid = false) => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 20 }, (_, i) => {
          const t = (i / 20) * Math.PI * 4;
          return new THREE.Vector3(
            Math.cos(t) * 0.8,
            (i / 20) * 3 - 1.5,
            Math.sin(t) * 0.8
          );
        })
      );
      const geo = new THREE.TubeGeometry(curve, 64, 0.15, 8, false);
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 15);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.015, 0.012), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat25',
    name: 'Pyramid',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('cone_1.5_2_4', () => new THREE.ConeGeometry(1.5, 2, 4));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.013, 0.01, 0.014), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat26',
    name: 'DNA Helix',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();

      // Create two intertwined helixes
      for (let h = 0; h < 2; h++) {
        const curve = new THREE.CatmullRomCurve3(
          Array.from({ length: 20 }, (_, i) => {
            const t = (i / 20) * Math.PI * 3 + (h * Math.PI);
            return new THREE.Vector3(
              Math.cos(t) * 0.6,
              (i / 20) * 3 - 1.5,
              Math.sin(t) * 0.6
            );
          })
        );
        const geo = new THREE.TubeGeometry(curve, 48, 0.08, 6, false);

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo, 15);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.016, 0.013) };
      return group;
    }
  },
  {
    id: 'mat27',
    name: 'Flower',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const petalCount = 8;

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const geo = new THREE.SphereGeometry(0.4, 16, 16);

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.position.set(Math.cos(angle) * 1, 0, Math.sin(angle) * 1);
          mesh.scale.set(1, 0.3, 1);
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.position.set(Math.cos(angle) * 1, 0, Math.sin(angle) * 1);
          mesh.scale.set(1, 0.3, 1);
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      }

      // Center
      const centerGeo = new THREE.SphereGeometry(0.3, 16, 16);
      if (isSolid) {
        const center = new THREE.Mesh(centerGeo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        center.userData.originalGeo = centerGeo;
        group.add(center);
      } else {
        const centerEdges = new THREE.EdgesGeometry(centerGeo);
        const center = new THREE.LineSegments(centerEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        center.userData.originalGeo = centerGeo;
        group.add(center);
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.014, 0.017) };
      return group;
    }
  },
  {
    id: 'mat28',
    name: 'Lattice Sphere',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const rings = 6;

      for (let i = 0; i < rings; i++) {
        const angle = (i / rings) * Math.PI;
        const geo = new THREE.TorusGeometry(Math.sin(angle) * 1.3, 0.08, 8, 32);

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.position.y = Math.cos(angle) * 1.3;
          mesh.rotation.x = Math.PI / 2;
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo, 15);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.position.y = Math.cos(angle) * 1.3;
          mesh.rotation.x = Math.PI / 2;
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      }

      group.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.012) };
      return group;
    }
  },
  {
    id: 'mat29',
    name: 'Wave Plane',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('wave_plane_3_3_20_20', () => {
        const g = new THREE.PlaneGeometry(3, 3, 20, 20);
        const positions = g.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = Math.sin(x * 2) * Math.cos(y * 2) * 0.3;
          positions.setZ(i, z);
        }
        g.computeVertexNormals();
        return g;
      });
      // const positions = geo.attributes.position; // Already modified in cache creator

      // geo.computeVertexNormals(); // Already done

      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color: MATERIAL_CONFIG.SOLID_COLOR,
          side: THREE.DoubleSide
        }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.01, 0.013, 0.015), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat30',
    name: 'Spiral Stairs',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const steps = 12;

      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const geo = new THREE.BoxGeometry(0.8, 0.1, 0.4);

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.position.set(Math.cos(angle) * 1, (i / steps) * 2 - 1, Math.sin(angle) * 1);
          mesh.rotation.y = angle;
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.position.set(Math.cos(angle) * 1, (i / steps) * 2 - 1, Math.sin(angle) * 1);
          mesh.rotation.y = angle;
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.012, 0.014) };
      return group;
    }
  },
  {
    id: 'mat31',
    name: 'Twisted Box',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const slices = 10;

      for (let i = 0; i < slices; i++) {
        const geo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        const twist = (i / slices) * Math.PI * 0.5;

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.position.y = (i / slices) * 2 - 1;
          mesh.rotation.y = twist;
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.position.y = (i / slices) * 2 - 1;
          mesh.rotation.y = twist;
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      }

      group.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.016) };
      return group;
    }
  },
  {
    id: 'mat32',
    name: 'Atom',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();

      // Nucleus
      const nucleusGeo = new THREE.SphereGeometry(0.3, 16, 16);
      if (isSolid) {
        const nucleus = new THREE.Mesh(nucleusGeo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        nucleus.userData.originalGeo = nucleusGeo;
        group.add(nucleus);
      } else {
        const nucleusEdges = new THREE.EdgesGeometry(nucleusGeo);
        const nucleus = new THREE.LineSegments(nucleusEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        nucleus.userData.originalGeo = nucleusGeo;
        group.add(nucleus);
      }

      // Electron orbits
      const orbits = 3;
      for (let i = 0; i < orbits; i++) {
        const orbitAngle = (i / orbits) * Math.PI;
        const orbitGeo = new THREE.TorusGeometry(1.2, 0.05, 8, 32);

        if (isSolid) {
          const orbit = new THREE.Mesh(orbitGeo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          orbit.rotation.x = orbitAngle;
          orbit.rotation.y = orbitAngle * 0.5;
          orbit.userData.originalGeo = orbitGeo;
          group.add(orbit);
        } else {
          const orbitEdges = new THREE.EdgesGeometry(orbitGeo, 15);
          const orbit = new THREE.LineSegments(orbitEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          orbit.rotation.x = orbitAngle;
          orbit.rotation.y = orbitAngle * 0.5;
          orbit.userData.originalGeo = orbitGeo;
          group.add(orbit);
        }

        // Electron
        const electronGeo = new THREE.SphereGeometry(0.15, 8, 8);
        if (isSolid) {
          const electron = new THREE.Mesh(electronGeo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          electron.position.set(1.2, 0, 0);
          electron.userData.originalGeo = electronGeo;

          const electronGroup = new THREE.Group();
          electronGroup.add(electron);
          electronGroup.rotation.x = orbitAngle;
          electronGroup.rotation.y = orbitAngle * 0.5;
          group.add(electronGroup);
        } else {
          const electronEdges = new THREE.EdgesGeometry(electronGeo);
          const electron = new THREE.LineSegments(electronEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          electron.position.set(1.2, 0, 0);
          electron.userData.originalGeo = electronGeo;

          const electronGroup = new THREE.Group();
          electronGroup.add(electron);
          electronGroup.rotation.x = orbitAngle;
          electronGroup.rotation.y = orbitAngle * 0.5;
          group.add(electronGroup);
        }
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.015, 0.013) };
      return group;
    }
  },
  {
    id: 'mat33',
    name: 'Geodesic',
    create3D: (isSolid = false) => {
      const geo = getSharedGeometry('icosahedron_1.5_1', () => new THREE.IcosahedronGeometry(1.5, 1));
      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }
      mesh.userData = { vel: new THREE.Vector3(0.016, 0.01, 0.014), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat34',
    name: 'Penrose Triangle',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const tubeRadius = 0.15;

      // Create three connected tubes forming impossible triangle
      // const angles = [0, 120, 240];
      const positions = [
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-0.866, -0.5, 0),
        new THREE.Vector3(0.866, -0.5, 0)
      ];

      for (let i = 0; i < 3; i++) {
        const start = positions[i];
        const end = positions[(i + 1) % 3];

        // Create path between points
        const curve = new THREE.LineCurve3(start, end);
        const geo = new THREE.TubeGeometry(curve, 2, tubeRadius, 6, false);

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      }

      group.scale.multiplyScalar(1.2);
      group.userData = { vel: new THREE.Vector3(0.01, 0.015, 0.012) };
      return group;
    }
  },
  {
    id: 'mat35',
    name: 'Necker Cube',
    create3D: (isSolid = false) => {
      // Create ambiguous wireframe cube (optical illusion)
      const size = 1.5;
      const geo = getSharedGeometry('box_1.5_1.5_1.5', () => new THREE.BoxGeometry(1.5, 1.5, 1.5));

      // Always show as wireframe for ambiguous effect
      const edges = new THREE.EdgesGeometry(geo);
      const material = new THREE.LineBasicMaterial({
        color: MATERIAL_CONFIG.WIREFRAME_COLOR,
        linewidth: 2
      });
      const mesh = new THREE.LineSegments(edges, material);

      // Add corner spheres to enhance ambiguity
      if (isSolid) {
        const cornerGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const cornerMat = new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR });

        const corners = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];

        const group = new THREE.Group();
        group.add(mesh);

        corners.forEach(([x, y, z]) => {
          const corner = new THREE.Mesh(cornerGeo.clone(), cornerMat.clone());
          corner.position.set(x * size / 2, y * size / 2, z * size / 2);
          corner.userData.originalGeo = cornerGeo;
          group.add(corner);
        });

        group.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.013), originalGeo: geo };
        return group;
      }

      mesh.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.013), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat36',
    name: 'Impossible Fork',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();

      // Three prongs that impossibly merge
      const prongGeo = getSharedGeometry('cylinder_0.15_0.15_2_8', () => new THREE.CylinderGeometry(0.15, 0.15, 2, 8));

      // Create three prongs
      const prongs = [
        { pos: [-0.4, 0, 0], rot: 0 },
        { pos: [0, 0, 0], rot: 0 },
        { pos: [0.4, 0, 0], rot: 0 }
      ];

      prongs.forEach(({ pos, rot }) => {
        if (isSolid) {
          const mesh = new THREE.Mesh(prongGeo.clone(), new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.position.set(pos[0], pos[1], pos[2]);
          mesh.rotation.z = rot;
          mesh.userData.originalGeo = prongGeo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(prongGeo);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.position.set(pos[0], pos[1], pos[2]);
          mesh.rotation.z = rot;
          mesh.userData.originalGeo = prongGeo;
          group.add(mesh);
        }
      });

      // Add connecting base (creates impossibility)
      const baseGeo = getSharedGeometry('box_1.2_0.3_0.5', () => new THREE.BoxGeometry(1.2, 0.3, 0.5));
      if (isSolid) {
        const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        base.position.y = -1.2;
        base.userData.originalGeo = baseGeo;
        group.add(base);
      } else {
        const baseEdges = new THREE.EdgesGeometry(baseGeo);
        const base = new THREE.LineSegments(baseEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        base.position.y = -1.2;
        base.userData.originalGeo = baseGeo;
        group.add(base);
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.016, 0.014) };
      return group;
    }
  },
  {
    id: 'mat37',
    name: 'Sierpinski Triangle',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();

      // Create 3D Sierpinski tetrahedron (fractal)
      const createTetrahedron = (size: number, pos: THREE.Vector3, depth: number) => {
        if (depth === 0) {
          const geo = getSharedGeometry(`tetrahedron_${size}`, () => new THREE.TetrahedronGeometry(size));

          if (isSolid) {
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
            mesh.position.copy(pos);
            mesh.userData.originalGeo = geo;
            group.add(mesh);
          } else {
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
            mesh.position.copy(pos);
            mesh.userData.originalGeo = geo;
            group.add(mesh);
          }
        } else {
          const newSize = size / 2;
          const offset = size / 2;

          // Create 4 smaller tetrahedrons
          createTetrahedron(newSize, new THREE.Vector3(pos.x, pos.y + offset, pos.z), depth - 1);
          createTetrahedron(newSize, new THREE.Vector3(pos.x - offset, pos.y - offset / 2, pos.z - offset), depth - 1);
          createTetrahedron(newSize, new THREE.Vector3(pos.x + offset, pos.y - offset / 2, pos.z - offset), depth - 1);
          createTetrahedron(newSize, new THREE.Vector3(pos.x, pos.y - offset / 2, pos.z + offset), depth - 1);
        }
      };

      createTetrahedron(0.6, new THREE.Vector3(0, 0, 0), 2);

      group.userData = { vel: new THREE.Vector3(0.012, 0.01, 0.015) };
      return group;
    }
  },
  {
    id: 'mat38',
    name: 'Rubik Cube',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const cubeSize = 0.45;
      const gap = 0.05;

      // Create 3x3x3 Rubik's cube
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const geo = getSharedGeometry(`box_${cubeSize}`, () => new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize));
            const pos = new THREE.Vector3(
              x * (cubeSize + gap),
              y * (cubeSize + gap),
              z * (cubeSize + gap)
            );

            if (isSolid) {
              const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
              mesh.position.copy(pos);
              mesh.userData.originalGeo = geo;
              group.add(mesh);
            } else {
              const edges = new THREE.EdgesGeometry(geo);
              const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
              mesh.position.copy(pos);
              mesh.userData.originalGeo = geo;
              group.add(mesh);
            }
          }
        }
      }

      group.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.013) };
      return group;
    }
  },
  {
    id: 'mat39',
    name: 'Tesseract',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();

      // 4D hypercube projected to 3D
      const innerSize = 0.8;
      const outerSize = 1.6;

      const innerGeo = getSharedGeometry(`box_${innerSize}`, () => new THREE.BoxGeometry(innerSize, innerSize, innerSize));
      const outerGeo = getSharedGeometry(`box_${outerSize}`, () => new THREE.BoxGeometry(outerSize, outerSize, outerSize));

      // Inner cube
      if (isSolid) {
        const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
        inner.userData.originalGeo = innerGeo;
        group.add(inner);

        const outer = new THREE.Mesh(outerGeo, new THREE.MeshStandardMaterial({
          color: MATERIAL_CONFIG.SOLID_COLOR,
          transparent: true,
          opacity: 0.3
        }));
        outer.userData.originalGeo = outerGeo;
        group.add(outer);
      } else {
        const innerEdges = new THREE.EdgesGeometry(innerGeo);
        const inner = new THREE.LineSegments(innerEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        inner.userData.originalGeo = innerGeo;
        group.add(inner);

        const outerEdges = new THREE.EdgesGeometry(outerGeo);
        const outer = new THREE.LineSegments(outerEdges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
        outer.userData.originalGeo = outerGeo;
        group.add(outer);

        // Connect corners
        const corners = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];

        corners.forEach(([x, y, z]) => {
          const points = [
            new THREE.Vector3(x * innerSize / 2, y * innerSize / 2, z * innerSize / 2),
            new THREE.Vector3(x * outerSize / 2, y * outerSize / 2, z * outerSize / 2)
          ];
          const lineGeo = getSharedGeometry(`line_${x}_${y}_${z}`, () => new THREE.BufferGeometry().setFromPoints(points));
          const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          group.add(line);
        });
      }

      group.userData = { vel: new THREE.Vector3(0.01, 0.014, 0.016) };
      return group;
    }
  },
  {
    id: 'mat40',
    name: 'Hexagonal Grid',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();
      const hexRadius = 0.3;
      const rows = 3;
      const cols = 3;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * hexRadius * 1.8 + (row % 2) * hexRadius * 0.9 - 1;
          const y = row * hexRadius * 1.5 - 1;

          const geo = getSharedGeometry('cylinder_hex', () => new THREE.CylinderGeometry(hexRadius, hexRadius, 0.1, 6));

          if (isSolid) {
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
            mesh.position.set(x, y, 0);
            mesh.rotation.x = Math.PI / 2;
            mesh.userData.originalGeo = geo;
            group.add(mesh);
          } else {
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
            mesh.position.set(x, y, 0);
            mesh.rotation.x = Math.PI / 2;
            mesh.userData.originalGeo = geo;
            group.add(mesh);
          }
        }
      }

      group.userData = { vel: new THREE.Vector3(0.013, 0.01, 0.017) };
      return group;
    }
  },
  {
    id: 'mat41',
    name: 'Möbius Strip',
    create3D: (isSolid = false) => {
      // Create Möbius strip using parametric geometry
      const radius = 1.2;
      const width = 0.3;
      const segments = 64;

      const points: THREE.Vector3[] = [];

      for (let i = 0; i <= segments; i++) {
        const u = (i / segments) * Math.PI * 2;
        const v = width;

        // Möbius strip parametric equations
        const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
        const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
        const z = v * Math.sin(u / 2);

        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points, true);
      const geo = getSharedGeometry('mobius_tube', () => new THREE.TubeGeometry(curve, segments, 0.1, 8, false));

      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 15);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }

      mesh.userData = { vel: new THREE.Vector3(0.01, 0.012, 0.015), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat42',
    name: 'Golden Spiral',
    create3D: (isSolid = false) => {
      const points: THREE.Vector3[] = [];
      const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

      // Create golden spiral in 3D
      for (let i = 0; i <= 100; i++) {
        const t = i / 20;
        const r = Math.pow(phi, t / 5);
        const theta = t * Math.PI * 2;

        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = t * 0.3 - 1.5;

        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geo = getSharedGeometry('golden_spiral', () => new THREE.TubeGeometry(curve, 200, 0.08, 8, false));

      let mesh: THREE.Object3D;
      if (isSolid) {
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
      } else {
        const edges = new THREE.EdgesGeometry(geo, 15);
        mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
      }

      mesh.scale.multiplyScalar(0.3);
      mesh.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.014), originalGeo: geo };
      return mesh;
    }
  },
  {
    id: 'mat43',
    name: 'Logic Puzzle',
    create3D: (isSolid = false) => {
      const group = new THREE.Group();

      // Create pattern recognition puzzle pieces
      const shapes = [
        { type: 'box', size: 0.4, pos: [-1, 0.8, 0] },
        { type: 'sphere', size: 0.3, pos: [0, 0.8, 0] },
        { type: 'cone', size: 0.3, pos: [1, 0.8, 0] },
        { type: 'cylinder', size: 0.3, pos: [-0.5, -0.8, 0] },
        { type: 'tetra', size: 0.4, pos: [0.5, -0.8, 0] }
      ];

      shapes.forEach(({ type, size, pos }) => {
        let geo: THREE.BufferGeometry;

        switch (type) {
          case 'box':
            geo = getSharedGeometry(`logic_box_${size}`, () => new THREE.BoxGeometry(size, size, size));
            break;
          case 'sphere':
            geo = getSharedGeometry(`logic_sphere_${size}`, () => new THREE.SphereGeometry(size, 16, 16));
            break;
          case 'cone':
            geo = getSharedGeometry(`logic_cone_${size}`, () => new THREE.ConeGeometry(size, size * 1.5, 8));
            break;
          case 'cylinder':
            geo = getSharedGeometry(`logic_cylinder_${size}`, () => new THREE.CylinderGeometry(size, size, size * 1.5, 8));
            break;
          case 'tetra':
            geo = getSharedGeometry(`logic_tetra_${size}`, () => new THREE.TetrahedronGeometry(size));
            break;
          default:
            geo = getSharedGeometry(`logic_box_${size}`, () => new THREE.BoxGeometry(size, size, size));
        }

        if (isSolid) {
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: MATERIAL_CONFIG.SOLID_COLOR }));
          mesh.position.set(pos[0], pos[1], pos[2]);
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        } else {
          const edges = new THREE.EdgesGeometry(geo);
          const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: MATERIAL_CONFIG.WIREFRAME_COLOR }));
          mesh.position.set(pos[0], pos[1], pos[2]);
          mesh.userData.originalGeo = geo;
          group.add(mesh);
        }
      });

      group.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.012) };
      return group;
    }
  }
];

// Export material count
export const MATERIAL_COUNT = MATERIALS.length;

// Get material by ID
export function getMaterialById(id: string): Material | undefined {
  return MATERIALS.find(m => m.id === id);
}

// Get material by index
export function getMaterialByIndex(index: number): Material | undefined {
  return MATERIALS[index];
}
