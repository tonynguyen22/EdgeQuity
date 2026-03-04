exports.handler = async function(event) {
  const responseObj = {};
  
  if (event.httpMethod !== 'POST') {
    responseObj.statusCode = 405;
    responseObj.body = 'Method Not Allowed';
    return responseObj;
  }

  try {
    const reqBody = JSON.parse(event.body);
    const targetUrl = reqBody.url;
    const customHeaders = reqBody.headers || {};

    if (!targetUrl) {
      responseObj.statusCode = 400;
      responseObj.body = 'URL is required';
      return responseObj;
    }

    customHeaders['User-Agent'] = 'ValuWise/1.0 contact@valuwise.app';

    const fetchOptions = {};
    fetchOptions.headers = customHeaders;
    fetchOptions.method = 'GET';

    const secResponse = await fetch(targetUrl, fetchOptions);

    if (!secResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await secResponse.json();

    responseObj.statusCode = 200;
    responseObj.body = JSON.stringify(data);
    
    const resHeaders = {};
    resHeaders['Content-Type'] = 'application/json';
    responseObj.headers = resHeaders;

    return responseObj;
  } catch (error) {
    responseObj.statusCode = 500;
    responseObj.body = 'Failed to fetch data from SEC';
    return responseObj;
  }
};