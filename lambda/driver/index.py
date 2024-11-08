import boto3
import time
import os
import urllib.request

s3 = boto3.client('s3')

def lambda_handler(event, context):
    
    BUCKET_NAME = os.environ['BUCKET_NAME']
    PLOT_API_ENDPOINT = os.environ['API_URL']
    
    #create assign1.txt
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key='assignment1.txt',
        Body='Empty Assignment 1'
    )
    print("'assignment1.txt' created")
    
    time.sleep(2)
    
    #update assign1
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key='assignment1.txt',
        Body='Empty Assignment 2222222222'
    )
    print("'assignment1.txt' updated")
    
    time.sleep(2)
    
     #delete assign
    s3.delete_object(
        Bucket=BUCKET_NAME,
        Key='assignment1.txt'
    )
    print("Deleted 'assignment1.txt'.")

    time.sleep(2)

    #create 'assignment2.txt' with content '33'
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key='assignment2.txt',
        Body='33'
    )
    print("Created 'assignment2.txt' with content '33'.")

    time.sleep(2)
    
    #Invoke the plotting
    try:
        with urllib.request.urlopen(PLOT_API_ENDPOINT) as response:
            result = response.read()
            print('Plotting Lambda invoked successfully.')
    except Exception as e:
        print('Failed to invoke plotting Lambda:', e)

    return {
        'statusCode': 200,
        'body': 'Processing complete.'
    }

