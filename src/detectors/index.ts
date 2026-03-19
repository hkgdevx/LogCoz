/**************************************************************************************************************************
 Copyright (c) 2026

     Name: index.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { docker } from '@/detectors/container/docker';
import { kubernetes } from '@/detectors/container/kubernetes';
import { mongodb } from '@/detectors/database/mongodb';
import { mysql } from '@/detectors/database/mysql';
import { redis } from '@/detectors/database/redis';
import { postgres } from '@/detectors/database/postgres';
import { kafka } from '@/detectors/messaging/kafka';
import { rabbitmq } from '@/detectors/messaging/rabbitmq';
import { dns } from '@/detectors/network/dns';
import { port } from '@/detectors/network/port';
import { tls } from '@/detectors/network/tls';
import { timeout } from '@/detectors/network/timeout';
import { nginx } from '@/detectors/proxy/nginx';
import { file } from '@/detectors/runtime/file';
import { oom } from '@/detectors/runtime/oom';

/**************************************************************************************************************************
 EXPORTS
***************************************************************************************************************************/
export const detectors: IssueDetector[] = [
  docker,
  kubernetes,
  redis,
  postgres,
  mysql,
  mongodb,
  kafka,
  rabbitmq,
  nginx,
  port,
  timeout,
  tls,
  dns,
  file,
  oom
];
