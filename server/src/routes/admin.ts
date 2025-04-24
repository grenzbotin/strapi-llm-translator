export default [
  {
    method: 'POST',
    path: '/generate',
    handler: 'admin.generate',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/config',
    handler: 'admin.getConfig',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/config',
    handler: 'admin.setConfig',
    config: {
      policies: [],
    },
  },
];
