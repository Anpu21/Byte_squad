import { Module } from '@nestjs/common';
import { CustomerGroupsModule } from '@/modules/customer-groups/customer-groups.module';
import { ChatAttachmentsController } from '@/modules/chat/chat-attachments.controller';
import { ChatAttachmentsService } from '@/modules/chat/chat-attachments.service';

/**
 * Backend chat surface. v1 is a single stateless attachment-upload endpoint
 * (CloudinaryModule is @Global). CustomerGroupsModule is imported so uploads can
 * be gated to members of the target group. Conversations and messages live in
 * the standalone realtime service, not here.
 */
@Module({
  imports: [CustomerGroupsModule],
  controllers: [ChatAttachmentsController],
  providers: [ChatAttachmentsService],
})
export class ChatModule {}
