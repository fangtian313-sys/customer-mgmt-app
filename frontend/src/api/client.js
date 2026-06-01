import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('请求添加 token:', config.url);
    } else {
      console.log('请求无 token:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('请求成功:', response.config.url);
    return response;
  },
  (error) => {
    console.error('请求失败:', error.config?.url);
    console.error('HTTP状态:', error.response?.status);
    console.error('错误详情:', error.response?.data);
    if (error.response?.status === 401) {
      console.log('收到 401，清除 token 并跳转到登录页');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
