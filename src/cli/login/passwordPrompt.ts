import prompt from 'prompt';

type Result = {
  apiKey: string;
};

export default async function (url: string): Promise<string> {
  // TODO: Prompt for the API key and store it
  console.log(`Logging into ${url}`);

  return new Promise((resolve, reject) => {
    const properties = [
      {
        name: 'apiKey',
        description: `Please paste your API key`,
        replace: '*',
        required: true,
        hidden: true,
      },
    ];

    prompt.colors = false;
    prompt.message = '';
    prompt.start();
    prompt.get(properties, function (err: Error | null, result: Result) {
      if (err) {
        return reject(err);
      }
      resolve(result.apiKey);
    });
  });
}
