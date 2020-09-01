## Using a restricted deployment user

This solution can be deployed with a user that only has the necessary permissions - although they're not as restricted
as they could be.

**Creating User**

```shell
aws cloudformation create-stack \
  --stack-name airmash-leaderboard-deployment-user \
  --capabilities CAPABILITY_NAMED_IAM \
  --template-body file://./deployment-user.yml
```

**Updating User**

```shell
aws cloudformation update-stack \
  --stack-name airmash-leaderboard-deployment-user \
  --capabilities CAPABILITY_NAMED_IAM \
  --template-body file://./deployment-user.yml
```

### Configuring development environment

Follow these steps to configure your environment to use the deployment user.

```shell
# 1. Retrieve user's Access Key and Secret
aws cloudformation describe-stacks --stack-name airmash-leaderboard-deployment-user

# 2. Use the details from the previous command to create a profile for the user
aws configure --profile airmash-leaderboard-deployer

# 3. Example of performing an action using this new profile
AWS_PROFILE=airmash-leaderboard-deployer yarn test:integration
```
