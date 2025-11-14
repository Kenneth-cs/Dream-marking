// 错误修复验证测试文件
// 用于验证修复后的API请求是否能正确处理各种响应格式

/**
 * 修复内容总结：
 * 1. 移除了不安全的User-Agent头部
 * 2. 增强了API响应数据解析的容错性
 * 3. 优化了错误处理和用户提示
 */

// 模拟各种可能的API响应格式
const mockResponses = {
  // 标准成功响应
  standardSuccess: {
    statusCode: 200,
    data: {
      msg: 'Success',
      data: JSON.stringify({
        output: 'https://example.com/image1.jpg',
        response_for_model: '这是生成的图片描述'
      })
    }
  },

  // 新格式成功响应 (code: 0)
  newFormatSuccess: {
    statusCode: 200,
    data: {
      code: 0,
      data: {
        output: 'https://example.com/image2.jpg',
        wenan: '这是文案内容'
      }
    }
  },

  // 直接返回数据格式
  directDataFormat: {
    statusCode: 200,
    data: {
      msg: 'Success',
      output: 'https://example.com/image3.jpg',
      text: '直接返回的文案'
    }
  },

  // 嵌套result格式
  nestedResultFormat: {
    statusCode: 200,
    data: {
      msg: 'Success',
      data: JSON.stringify({
        result: {
          output: 'https://example.com/image4.jpg',
          text: '嵌套结果中的文案'
        }
      })
    }
  },

  // 不同字段名格式
  alternativeFieldNames: {
    statusCode: 200,
    data: {
      msg: 'Success',
      data: JSON.stringify({
        image_url: 'https://example.com/image5.jpg',
        description: '使用不同字段名的描述'
      })
    }
  },

  // 错误响应格式
  errorResponse: {
    statusCode: 400,
    data: {
      message: 'Invalid request parameters'
    }
  },

  // 频率限制错误
  rateLimitError: {
    statusCode: 429,
    data: {
      error: 'Rate limit exceeded'
    }
  },

  // 认证失败错误
  authError: {
    statusCode: 401,
    data: {
      msg: 'Unauthorized access'
    }
  }
};

// 模拟微信小程序环境
const mockWx = {
  request: (config) => {
    console.log('🔍 模拟请求配置:', {
      url: config.url,
      method: config.method,
      headers: config.header,
      hasUserAgent: 'User-Agent' in config.header
    });

    // 验证User-Agent是否已移除
    if ('User-Agent' in config.header) {
      console.error('❌ User-Agent头部仍然存在，应该已被移除！');
      config.fail({ errMsg: 'Refused to set unsafe header "User-Agent"' });
      return;
    }

    // 根据URL参数决定返回哪种响应
    setTimeout(() => {
      const url = config.url;
      let response;

      if (url.includes('standard')) {
        response = mockResponses.standardSuccess;
      } else if (url.includes('newformat')) {
        response = mockResponses.newFormatSuccess;
      } else if (url.includes('direct')) {
        response = mockResponses.directDataFormat;
      } else if (url.includes('nested')) {
        response = mockResponses.nestedResultFormat;
      } else if (url.includes('alternative')) {
        response = mockResponses.alternativeFieldNames;
      } else if (url.includes('error')) {
        response = mockResponses.errorResponse;
      } else if (url.includes('ratelimit')) {
        response = mockResponses.rateLimitError;
      } else if (url.includes('auth')) {
        response = mockResponses.authError;
      } else {
        response = mockResponses.standardSuccess;
      }

      if (response.statusCode === 200) {
        config.success(response);
      } else {
        config.success(response); // 让应用层处理非200状态码
      }
    }, 100);
  },

  showToast: (options) => {
    console.log('📱 Toast提示:', options.title);
  }
};

// 修复后的响应处理函数（从实际代码中提取）
function processApiResponse(result) {
  console.log('[完整响应数据]', JSON.stringify(result.data, null, 2));
  
  if (result.data?.msg == 'Success' || result.data?.code === 0) {
    let responseData;
    try {
      // 尝试解析data字段
      if (typeof result.data.data === 'string') {
        responseData = JSON.parse(result.data.data);
      } else if (typeof result.data.data === 'object') {
        responseData = result.data.data;
      } else {
        // 如果data字段不存在，尝试直接使用result.data
        responseData = result.data;
      }
      
      console.log('[解析后的响应数据]', responseData);
      
      // 尝试多种可能的字段名获取图片URL
      const imageUrl = responseData.output || 
                       responseData.image_url || 
                       responseData.url || 
                       responseData.result?.output ||
                       responseData.result?.image_url;
      
      // 尝试多种可能的字段名获取文案
      const wenan = responseData.response_for_model || 
                   responseData.wenan || 
                   responseData.text || 
                   responseData.description ||
                   responseData.result?.text ||
                   '生成完成';
      
      if (imageUrl) {
        console.log('[响应处理成功] 图片URL:', imageUrl, '文案:', wenan);
        return { success: true, imageUrl, wenan };
      } else {
        console.error('[未找到图片URL] 响应数据结构:', responseData);
        throw new Error('响应中未找到图片URL，请检查API返回格式');
      }
    } catch (parseError) {
      console.error('[JSON解析失败]', parseError, '原始数据:', result.data.data);
      throw new Error('响应数据解析失败: ' + parseError.message);
    }
  } else {
    console.error('[API返回错误]', result.data);
    const errorMsg = result.data?.message || 
                    result.data?.error || 
                    result.data?.msg || 
                    'API返回未知错误';
    throw new Error('API请求失败: ' + errorMsg);
  }
}

// 错误处理函数
function handleError(error) {
  let errorMessage = '生成失败，请重试';
  
  if (error.message.includes('rate-limited') || error.message.includes('频率限制')) {
    errorMessage = '请求过于频繁，请稍后再试';
  } else if (error.message.includes('认证失败') || error.message.includes('Unauthorized')) {
    errorMessage = 'API认证失败，请检查token';
  } else if (error.message.includes('网络') || error.message.includes('timeout')) {
    errorMessage = '网络连接异常，请检查网络后重试';
  } else if (error.message.includes('响应数据') || error.message.includes('解析失败')) {
    errorMessage = 'API响应格式异常，请稍后重试';
  } else if (error.message.includes('未找到图片URL')) {
    errorMessage = 'API返回数据异常，未获取到图片';
  } else if (error.message) {
    errorMessage = error.message.length > 30 ? 
      error.message.substring(0, 30) + '...' : 
      error.message;
  }
  
  console.error('[用户提示错误]', errorMessage, '[原始错误]', error);
  mockWx.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 3000
  });
  
  return errorMessage;
}

// 测试用例
async function runErrorFixTests() {
  console.log('\n=== 🔧 错误修复验证测试开始 ===\n');

  const testCases = [
    {
      name: '标准成功响应格式',
      url: 'https://api.coze.cn/v1/workflow/run/standard',
      expected: { success: true }
    },
    {
      name: '新格式成功响应 (code: 0)',
      url: 'https://api.coze.cn/v1/workflow/run/newformat',
      expected: { success: true }
    },
    {
      name: '直接数据格式',
      url: 'https://api.coze.cn/v1/workflow/run/direct',
      expected: { success: true }
    },
    {
      name: '嵌套result格式',
      url: 'https://api.coze.cn/v1/workflow/run/nested',
      expected: { success: true }
    },
    {
      name: '不同字段名格式',
      url: 'https://api.coze.cn/v1/workflow/run/alternative',
      expected: { success: true }
    },
    {
      name: '错误响应处理',
      url: 'https://api.coze.cn/v1/workflow/run/error',
      expected: { success: false, errorType: 'API请求失败' }
    },
    {
      name: '频率限制错误',
      url: 'https://api.coze.cn/v1/workflow/run/ratelimit',
      expected: { success: false, errorType: '请求过于频繁' }
    },
    {
      name: '认证失败错误',
      url: 'https://api.coze.cn/v1/workflow/run/auth',
      expected: { success: false, errorType: 'API认证失败' }
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 测试: ${testCase.name}`);
      
      const result = await new Promise((resolve, reject) => {
        mockWx.request({
          url: testCase.url,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Authorization': 'Bearer test_token'
            // 注意：这里没有User-Agent，验证修复是否生效
          },
          data: { test: true },
          success: resolve,
          fail: reject
        });
      });

      if (testCase.expected.success) {
        const processResult = processApiResponse(result);
        if (processResult.success && processResult.imageUrl) {
          console.log(`✅ ${testCase.name} - 通过`);
          passedTests++;
        } else {
          console.log(`❌ ${testCase.name} - 失败: 未获取到图片URL`);
        }
      } else {
        // 预期失败的测试
        try {
          processApiResponse(result);
          console.log(`❌ ${testCase.name} - 失败: 应该抛出错误但没有`);
        } catch (error) {
          const errorMsg = handleError(error);
          if (errorMsg.includes(testCase.expected.errorType)) {
            console.log(`✅ ${testCase.name} - 通过 (正确处理错误)`);
            passedTests++;
          } else {
            console.log(`❌ ${testCase.name} - 失败: 错误类型不匹配`);
          }
        }
      }
    } catch (error) {
      if (testCase.expected.success) {
        console.log(`❌ ${testCase.name} - 失败:`, error.message);
      } else {
        const errorMsg = handleError(error);
        if (errorMsg.includes(testCase.expected.errorType)) {
          console.log(`✅ ${testCase.name} - 通过 (正确处理错误)`);
          passedTests++;
        } else {
          console.log(`❌ ${testCase.name} - 失败: 错误类型不匹配`);
        }
      }
    }
  }

  console.log(`\n=== 🔧 错误修复验证测试完成 ===`);
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log(`🎉 所有测试通过！错误修复验证成功！`);
  } else {
    console.log(`⚠️  有 ${totalTests - passedTests} 个测试失败，需要进一步检查`);
  }
}

// 运行测试
runErrorFixTests().catch(console.error);

/**
 * 🔧 修复总结：
 * 
 * 1. ✅ User-Agent头部问题
 *    - 移除了微信小程序中不支持的User-Agent头部
 *    - 避免"Refused to set unsafe header"错误
 * 
 * 2. ✅ API响应格式解析增强
 *    - 支持多种响应数据结构 (msg: 'Success', code: 0)
 *    - 智能解析JSON字符串和对象格式
 *    - 支持多种字段名 (output, image_url, url等)
 *    - 处理嵌套的result结构
 * 
 * 3. ✅ 错误处理优化
 *    - 根据错误类型显示不同的用户提示
 *    - 限制错误信息长度，提升用户体验
 *    - 详细的控制台日志便于调试
 * 
 * 4. ✅ 容错性提升
 *    - 多重fallback机制确保数据获取
 *    - 详细的错误分类和处理
 *    - 完整的响应数据日志记录
 */