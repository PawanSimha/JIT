'use strict';
const DEVICES = [
  {
    id: 'android1',
    name: 'Android',
    width: 360,
    height: 800,
    category: 'mobile',
    icon: 'android'
  },
  {
    id: 'iphone1',
    name: 'iPhone',
    width: 390,
    height: 844,
    category: 'mobile',
    icon: 'apple'
  },
  {
    id: 'tablet1',
    name: 'Tablet S',
    width: 800,
    height: 1280,
    category: 'tablet',
    icon: 'tablet'
  },
  {
    id: 'tablet2',
    name: 'iPad Pro',
    width: 834,
    height: 1194,
    category: 'tablet',
    icon: 'tablet'
  },
];

function getRotatedDimensions(device, orientation) {
  if (orientation === 'landscape') {
    return { width: device.height, height: device.width };
  }
  return { width: device.width, height: device.height };
}

function supportsRotation(device) {
  return device.category === 'mobile' || device.category === 'tablet';
}
