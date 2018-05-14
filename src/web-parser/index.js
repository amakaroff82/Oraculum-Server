import config from '../config';
import Axios from 'axios';

const MERCURY_URL = 'https://mercury.postlight.com';

export async function getPageContent (url) {

  try {
    const response = await Axios({
      url: `${MERCURY_URL}/parser?url=${url}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.webParser.mercuryApiKey
      }
    });

    return response.data.content;
  } catch (e) {
    console.error(`can't parse URL ${url}`);
    return '';
  }
}