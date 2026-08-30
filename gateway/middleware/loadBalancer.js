const counters = new Map();

export const getNextInstance = (serviceKey, instances) => {
  if (!instances || instances.length === 0) {
    throw new Error(`No available instances configured for service: ${serviceKey}`);
  }

  if (instances.length === 1) {
    return instances[0];
  }

  const currentIndex = counters.get(serviceKey) || 0;
  const targetInstance = instances[currentIndex % instances.length];
  counters.set(serviceKey, (currentIndex + 1) % instances.length);

  return targetInstance;
};

export const createLoadBalancedTarget = (serviceKey, instances) => {
  return () => getNextInstance(serviceKey, instances);
};
