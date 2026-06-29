import { Module } from '@nestjs/common';
import { ChatAttachmentsController } from '@/modules/chat/chat-attachments.controller';
import { ChatAttachmentsService } from '@/modules/chat/chat-attachments.service';

/**
 * Backend chat surface. v1 is a single stateless attachment-upload endpoint
 * (CloudinaryModule is @Global, so there's nothing to import). Conversations and
 * messages live in the standalone realtime service, not here.
 */
@Module({
  controllers: [ChatAttachmentsController],
  providers: [ChatAttachmentsService],
})
export class ChatModule {}
