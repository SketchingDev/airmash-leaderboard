const AWS = require("aws-sdk");

const region = "us-east-1";
const stackName = "stats-leaderboard-dev";

const cloudFormation = new AWS.CloudFormation({ region, apiVersion: "2010-05-15" });

cloudFormation.describeStacks(
  {
    StackName: stackName,
  },
  (err, data) => {
    data.Stacks.forEach(stack => {
      stack.Outputs.forEach(output => {
        if (output.OutputKey === "ServiceEndpoint") {
          console.log(`REACT_APP_API_ENDPOINT=${output.OutputValue}`);
        }
      });
    });
  },
);
