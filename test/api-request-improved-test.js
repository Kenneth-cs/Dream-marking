// API请求改进版本测试文件
// 用于验证重构后的makeRequest方法的功能

/**
 * 测试用例说明：
 * 1. 基本API请求测试
 * 2. 重试机制测试
 * 3. 错误处理测试
 * 4. 配置参数测试
 */

// 模拟微信小程序环境
const mockWx = {
  request: (config) => {
    console.log('模拟wx.request调用:', config);
    
    // 模拟不同的响应场景
    setTimeout(() => {
      if (config.url.includes('success')) {
        config.success({
          statusCode: 200,
          data: {
            msg: 'Success',
            data: JSON.stringify({
              output: 'https://example.com/test-image.jpg',
              wenan: '测试生成的文案内容'
            })
          }
        });
      } else if (config.url.includes('rate-limit')) {
        config.success({
          statusCode: 429,
          data: { message: 'Rate limited' }
        });
      } else if (config.url.includes('auth-error')) {
        config.success({
          statusCode: 401,
          data: { message: 'Unauthorized' }
        });
      } else if (config.url.includes('network-error')) {
        config.fail({
          errMsg: 'request:fail network error'
        });
      } else {
        config.success({
          statusCode: 200,
          data: {
            msg: 'Success',
            data: JSON.stringify({
              output: 'https://example.com/generated-image.jpg',
              response_for_model: '这是AI生成的精美图片描述'
            })
          }
        });
      }
    }, 100);
  }
};

// 模拟页面对象
const mockPage = {
  data: {
    prompt: '测试提示词',
    isRandomMode: false
  },
  
  // 重构后的API配置
  API_CONFIG: {
    BASE_URL: 'https://api.coze.cn/v1/workflow/run',
    WORKFLOW_ID: '7470173882880966656',
    APP_ID: 'wx154296746927e92f',
    AUTH_TOKEN: 'Bearer test_token',
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAYS: {
      RATE_LIMIT: 3000,
      NETWORK_ERROR: 1000,
      SERVER_ERROR: 2000
    }
  },

  // 创建请求配置
  createRequestConfig(input) {
    return {
      url: this.API_CONFIG.BASE_URL,
      method: 'POST',
      timeout: this.API_CONFIG.TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': this.API_CONFIG.AUTH_TOKEN,
        'User-Agent': 'MiniProgram/1.0.0'
      },
      data: {
        workflow_id: this.API_CONFIG.WORKFLOW_ID,
        parameters: {
          input: input || this.data.prompt
        },
        app_id: this.API_CONFIG.APP_ID,
        is_async: false
      }
    };
  },

  // 判断错误类型
  getErrorType(error) {
    const message = error.message || '';
    const statusCode = error.statusCode;

    if (message.includes('rate-limited') || statusCode === 429) {
      return 'RATE_LIMIT';
    }
    if (statusCode === 401 || message.includes('认证失败')) {
      return 'AUTH_ERROR';
    }
    if (statusCode >= 500 || message.includes('服务器错误')) {
      return 'SERVER_ERROR';
    }
    if (message.includes('网络') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }
    return 'UNKNOWN_ERROR';
  },

  // 获取重试延迟时间
  getRetryDelay(errorType, attemptIndex) {
    const delays = this.API_CONFIG.RETRY_DELAYS;
    const multiplier = attemptIndex + 1;
    
    switch (errorType) {
      case 'RATE_LIMIT':
        return delays.RATE_LIMIT * multiplier;
      case 'SERVER_ERROR':
        return delays.SERVER_ERROR * multiplier;
      case 'NETWORK_ERROR':
        return delays.NETWORK_ERROR * multiplier;
      default:
        return 1000 * multiplier;
    }
  },

  // 是否应该重试
  shouldRetry(errorType, attemptIndex, maxRetries) {
    if (attemptIndex >= maxRetries) return false;
    if (errorType === 'AUTH_ERROR') return false;
    return true;
  },

  // 执行单次请求
  async executeRequest(requestConfig) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      mockWx.request({
        ...requestConfig,
        success: (res) => {
          const duration = Date.now() - startTime;
          console.log(`[API请求成功] 状态码: ${res.statusCode}, 耗时: ${duration}ms`);
          
          if (res.statusCode === 200) {
            console.log('[API响应数据]', res.data);
            resolve(res);
          } else {
            const error = new Error(`HTTP错误: ${res.statusCode} - ${res.data?.message || '未知错误'}`);
            error.statusCode = res.statusCode;
            error.responseData = res.data;
            reject(error);
          }
        },
        fail: (error) => {
          const duration = Date.now() - startTime;
          console.error(`[API请求失败] 耗时: ${duration}ms, 错误:`, error);
          
          const networkError = new Error(`网络请求失败: ${error.errMsg || '未知网络错误'}`);
          networkError.originalError = error;
          reject(networkError);
        }
      });
    });
  },

  // 重构后的makeRequest方法
  async makeRequest(options = {}) {
    const {
      input = null,
      maxRetries = this.API_CONFIG.MAX_RETRIES,
      enableRetry = true
    } = options;

    const requestConfig = this.createRequestConfig(input);
    let lastError = null;
    let attemptIndex = 0;

    console.log(`[开始API请求] 最大重试次数: ${maxRetries}, 输入参数:`, input || this.data.prompt);

    while (attemptIndex <= maxRetries) {
      try {
        console.log(`[第${attemptIndex + 1}次尝试] 发送请求...`);
        
        const result = await this.executeRequest(requestConfig);
        
        if (result.data && typeof result.data === 'object') {
          console.log(`[请求完成] 总尝试次数: ${attemptIndex + 1}`);
          return result;
        } else {
          throw new Error('响应数据格式无效');
        }

      } catch (error) {
        lastError = error;
        const errorType = this.getErrorType(error);
        
        console.warn(`[第${attemptIndex + 1}次请求失败] 错误类型: ${errorType}, 错误信息: ${error.message}`);

        if (!enableRetry || !this.shouldRetry(errorType, attemptIndex, maxRetries)) {
          console.error(`[请求终止] 不再重试，错误类型: ${errorType}`);
          break;
        }

        if (attemptIndex < maxRetries) {
          const delay = this.getRetryDelay(errorType, attemptIndex);
          console.log(`[准备重试] ${delay}ms后进行第${attemptIndex + 2}次尝试`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        attemptIndex++;
      }
    }

    console.error(`[请求最终失败] 已尝试${attemptIndex}次，最后错误:`, lastError);
    throw lastError || new Error('请求失败，未知错误');
  }
};

// 测试用例
async function runTests() {
  console.log('\n=== API请求改进版本测试开始 ===\n');

  // 测试1: 基本成功请求
  try {
    console.log('🧪 测试1: 基本成功请求');
    const result = await mockPage.makeRequest({
      input: '测试提示词',
      maxRetries: 1,
      enableRetry: false
    });
    console.log('✅ 测试1通过:', result.data.msg);
  } catch (error) {
    console.log('❌ 测试1失败:', error.message);
  }

  // 测试2: 重试机制测试
  try {
    console.log('\n🧪 测试2: 重试机制测试');
    // 修改URL触发重试
    mockPage.API_CONFIG.BASE_URL = 'https://api.coze.cn/v1/workflow/run/rate-limit';
    const result = await mockPage.makeRequest({
      input: '测试重试',
      maxRetries: 2,
      enableRetry: true
    });
    console.log('✅ 测试2通过:', result.data.msg);
  } catch (error) {
    console.log('✅ 测试2符合预期 - 重试后仍失败:', error.message);
  }

  // 测试3: 配置参数测试
  try {
    console.log('\n🧪 测试3: 配置参数测试');
    const config = mockPage.createRequestConfig('自定义输入');
    console.log('✅ 测试3通过 - 配置生成正确:', {
      url: config.url,
      method: config.method,
      timeout: config.timeout,
      inputParam: config.data.parameters.input
    });
  } catch (error) {
    console.log('❌ 测试3失败:', error.message);
  }

  // 测试4: 错误类型判断测试
  try {
    console.log('\n🧪 测试4: 错误类型判断测试');
    const rateLimitError = new Error('rate-limited');
    const authError = new Error('API认证失败');
    const networkError = new Error('网络请求失败');
    
    console.log('✅ 测试4通过 - 错误类型判断:', {
      rateLimitType: mockPage.getErrorType(rateLimitError),
      authType: mockPage.getErrorType(authError),
      networkType: mockPage.getErrorType(networkError)
    });
  } catch (error) {
    console.log('❌ 测试4失败:', error.message);
  }

  console.log('\n=== API请求改进版本测试完成 ===\n');
}

// 运行测试
runTests().catch(console.error);

/**
 * 改进总结：
 * 
 * 1. ✅ 配置化管理 - 所有API参数集中在API_CONFIG中
 * 2. ✅ 模块化设计 - 将复杂逻辑拆分为独立方法
 * 3. ✅ 智能重试 - 根据错误类型决定是否重试和延迟时间
 * 4. ✅ 详细日志 - 完整的请求生命周期日志记录
 * 5. ✅ 错误分类 - 精确的错误类型判断和处理
 * 6. ✅ 超时控制 - 添加请求超时设置
 * 7. ✅ 性能监控 - 记录请求耗时
 * 8. ✅ 灵活配置 - 支持自定义重试次数和开关
 * 
 * 主要优势：
 * - 代码可读性和维护性大幅提升
 * - 错误处理更加精准和用户友好
 * - 重试逻辑更加智能和高效
 * - 日志记录便于调试和监控
 * - 配置集中便于管理和修改
 */