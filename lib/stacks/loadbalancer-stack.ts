import { Construct } from 'constructs';
import { AwsStackBase, BaseStackProps } from 'stackbase';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';

export interface LbConfigs extends BaseStackProps {
    securityGroup: string,
}

export class loadBalancerStack extends AwsStackBase {
    public lb: Alb;
    public lbl: AlbListener;
    public targetGroup: AlbTargetGroup;
    constructor(scope: Construct, id: string, props: LbConfigs) {
        super(scope, `${props.name}-${id}`, {
            name: props.name,
            project: props.project,
            region: props.region,
        })

        this.lb = new Alb (this, `${props.name}-load-balancer`, {
            securityGroups: [props.securityGroup],
            namePrefix: "cl-",
            loadBalancerType: "application",
            subnets: [`${process.env.SUBNET}`, `${process.env.SUBNET_2}`],
            idleTimeout: 60,
            ipAddressType: "dualstack",
        })

        this.targetGroup = new AlbTargetGroup(this,  `${props.name}-target-group`, {
          namePrefix: "cl-",
          port: 80,
          protocol: "HTTP",
          vpcId: `${process.env.VPC_ID}`,
          deregistrationDelay: "30",
          targetType: "ip",

          healthCheck: {
            enabled: true,
            path: "/wp-admin/images/wordpress-logo.svg",
            healthyThreshold: 3,
            unhealthyThreshold: 3,
            timeout: 30,
            interval: 60,
            protocol: "HTTP",
          }
        })

        this.lbl = new AlbListener(this, `${props.name}-listener`, {
          loadBalancerArn: this.lb.arn,
          port: 80,
          protocol: "HTTP",

          defaultAction: [
            {
              type: "forward",
              targetGroupArn: this.targetGroup.arn,
            },
          ],
        })

    }
}
