// Shape Dividers Library - SVG paths for section transitions

export const shapeDividers = [
  {
    id: 'none',
    name: 'None',
    path: null
  },
  {
    id: 'wave',
    name: 'Wave',
    path: 'M0,64 C150,96 350,0 500,64 C650,128 850,32 1000,64 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'wave-smooth',
    name: 'Smooth Wave',
    path: 'M0,50 Q250,100 500,50 T1000,50 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'wave-layered',
    name: 'Layered Wave',
    path: 'M0,40 C150,80 350,0 500,40 C650,80 850,0 1000,40 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 80'
  },
  {
    id: 'curve',
    name: 'Curve',
    path: 'M0,100 Q500,0 1000,100 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'curve-asymmetric',
    name: 'Asymmetric Curve',
    path: 'M0,100 Q300,0 1000,80 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'triangle',
    name: 'Triangle',
    path: 'M500,100 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'triangle-asymmetric',
    name: 'Asymmetric Triangle',
    path: 'M0,0 L1000,0 L1000,20 L300,100 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'peaks',
    name: 'Peaks',
    path: 'M0,100 L200,20 L400,80 L600,10 L800,70 L1000,0 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'slant',
    name: 'Slant',
    path: 'M0,100 L1000,0 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'slant-gentle',
    name: 'Gentle Slant',
    path: 'M0,50 L1000,0 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 50'
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    path: 'M0,50 L50,100 L100,50 L150,100 L200,50 L250,100 L300,50 L350,100 L400,50 L450,100 L500,50 L550,100 L600,50 L650,100 L700,50 L750,100 L800,50 L850,100 L900,50 L950,100 L1000,50 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'clouds',
    name: 'Clouds',
    path: 'M0,100 C50,100 50,60 100,60 C150,60 150,80 200,80 C250,80 250,40 300,40 C350,40 350,70 400,70 C450,70 450,50 500,50 C550,50 550,90 600,90 C650,90 650,30 700,30 C750,30 750,60 800,60 C850,60 850,80 900,80 C950,80 950,50 1000,50 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'drops',
    name: 'Drops',
    path: 'M0,100 Q100,100 100,50 T200,50 T300,50 T400,50 T500,50 T600,50 T700,50 T800,50 T900,50 T1000,50 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'arrow',
    name: 'Arrow',
    path: 'M0,0 L500,100 L1000,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'split',
    name: 'Split',
    path: 'M0,0 L0,50 L500,100 L1000,50 L1000,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'rounded',
    name: 'Rounded',
    path: 'M0,100 C0,0 1000,0 1000,100 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  },
  {
    id: 'tilt',
    name: 'Tilt',
    path: 'M0,80 Q500,120 1000,20 L1000,0 L0,0 Z',
    viewBox: '0 0 1000 100'
  }
];

export function getDividerById(id) {
  return shapeDividers.find(d => d.id === id) || shapeDividers[0];
}

export function getDividerPath(id, position = 'bottom', flip = false) {
  const divider = getDividerById(id);
  if (!divider || !divider.path) return null;
  
  return {
    ...divider,
    position,
    flip
  };
}

export default shapeDividers;

