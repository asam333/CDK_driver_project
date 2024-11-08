import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class Proj3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create s3 bucket
    const bucket = new s3.Bucket(this, 'TestBucket', {
      bucketName: 'testbucketkiita0130',
    });

    //create dynamoDB table
    const table = new dynamodb.Table(this, 'S3ObjectSizeHistory', {
      tableName: 'S3-object-size-history',
      partitionKey: { name: 'BucketName', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'Timestamp', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
	    indexName: 'BucketName-TotalSize-index',
	    partitionKey: { name: 'BucketName', type: dynamodb.AttributeType.STRING },
	    sortKey: { name: 'TotalSize', type: dynamodb.AttributeType.NUMBER },
	    projectionType: dynamodb.ProjectionType.ALL,
    });
    
    //create sizeTracking func
    const sizeTrackingLambda = new lambda.Function(this, 'SizeTrackingLambda', {
	    runtime: lambda.Runtime.PYTHON_3_10,
	    handler: 'index.lambda_handler',
	    code: lambda.Code.fromAsset('lambda/size-tracking'),
	    environment: {
		    TABLE_NAME: table.tableName,
		    BUCKET_NAME: bucket.bucketName,
	    },
    });

    bucket.grantRead(sizeTrackingLambda);
    table.grantWriteData(sizeTrackingLambda);

    bucket.addEventNotification(
	    s3.EventType.OBJECT_CREATED,
	    new s3n.LambdaDestination(sizeTrackingLambda)
    );
    bucket.addEventNotification(
	    s3.EventType.OBJECT_REMOVED,
	    new s3n.LambdaDestination(sizeTrackingLambda)
    );

    //create plotting func
    const plottingLambda = new lambda.Function(this, 'PlottingLambda', {
	    runtime: lambda.Runtime.PYTHON_3_11,
	    handler: 'index.lambda_handler',
	    code: lambda.Code.fromAsset('lambda/plotting'),
	    environment: {
		    TABLE_NAME: table.tableName,
		    BUCKET_NAME: bucket.bucketName,
	    },
	    layers: [
		    lambda.LayerVersion.fromLayerVersionArn(this, 'NumpyLayer', 'arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p311-numpy:10'),
		    lambda.LayerVersion.fromLayerVersionArn(this, 'MatplotlibLayer', 'arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p311-matplotlib:11'),
	    ],
    });

    table.grantReadData(plottingLambda);
    bucket.grantWrite(plottingLambda);

    const api = new apigateway.LambdaRestApi(this, 'PlottingApi', {
	    handler: plottingLambda,
    });

    //create driver
    const driverLambda = new lambda.Function(this, 'DriverLambda', {
	    runtime: lambda.Runtime.PYTHON_3_12,
	    handler: 'index.lambda_handler',
	    code: lambda.Code.fromAsset('lambda/driver'),
	    environment: {
		    BUCKET_NAME: bucket.bucketName,
		    API_URL: api.url,
	    },
    });

    bucket.grantReadWrite(driverLambda);




  }
}
