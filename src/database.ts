import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class Database extends Construct {
  public readonly meetingsTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.meetingsTable = new dynamodb.Table(this, 'meetings', {
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.meetingsTable.addGlobalSecondaryIndex({
      indexName: 'meetingIdIndex',
      partitionKey: {
        name: 'meetingId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
