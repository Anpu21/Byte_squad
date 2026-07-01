import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { ChatAttachmentsService } from '@/modules/chat/chat-attachments.service';
import {
  CHAT_ATTACHMENT_MIME_REGEX,
  MAX_CHAT_ATTACHMENT_BYTES,
} from '@/modules/chat/chat-attachment.constants';
import type { ChatAttachmentUpload } from '@/modules/chat/types/chat-attachment-upload.type';

/**
 * Stateless upload endpoint for chat attachments. The bytes go to Cloudinary and
 * the returned metadata is attached to a message by the realtime chat service
 * (which owns the attachment record). Customer-only and gated to members of the
 * target group, so a non-member can't even spend an upload.
 */
@Controller(APP_ROUTES.CHAT.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatAttachmentsController {
  constructor(private readonly attachments: ChatAttachmentsService) {}

  @Post(APP_ROUTES.CHAT.ATTACHMENTS)
  @Roles(UserRole.CUSTOMER)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser('id') userId: string,
    @Body('groupId', ParseUUIDPipe) groupId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_CHAT_ATTACHMENT_BYTES }),
          // Validate the declared mime, not file content: text/csv, .docx and
          // .xlsx have no distinct magic number (docx/xlsx sniff as ZIP), so
          // content-based validation would wrongly reject them.
          new FileTypeValidator({
            fileType: CHAT_ATTACHMENT_MIME_REGEX,
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ChatAttachmentUpload> {
    return this.attachments.upload(file, userId, groupId);
  }
}
