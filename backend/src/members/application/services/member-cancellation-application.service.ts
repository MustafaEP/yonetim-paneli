/**
 * Member Cancellation Application Service
 * 
 * Use case: Member cancellation işlemini orchestrate eder (ACTIVE → RESIGNED/EXPELLED/INACTIVE)
 * 
 * Sorumluluklar:
 * - Transaction yönetimi
 * - Domain Entity çağırma
 * - Cross-cutting concerns (history)
 * - Repository koordinasyonu
 */
import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { Member } from '../../domain/entities/member.entity';
import type { MemberRepository } from '../../domain/repositories/member.repository.interface';
import { MemberHistoryService } from '../../member-history.service';
import {
  MemberNotFoundException,
  MemberCannotBeCancelledException,
  MemberCancellationReasonRequiredException,
} from '../../domain/exceptions/member-domain.exception';
import { MemberStatusEnum } from '../../domain/value-objects/member-status.vo';

export interface CancelMemberCommand {
  memberId: string;
  cancelledByUserId: string;
  status: MemberStatusEnum; // RESIGNED, EXPELLED, veya INACTIVE
  cancellationReason: string;
}

@Injectable()
export class MemberCancellationApplicationService {
  private readonly logger = new Logger(MemberCancellationApplicationService.name);

  constructor(
    @Inject('MemberRepository')
    private readonly memberRepository: MemberRepository,
    private readonly memberHistoryService: MemberHistoryService,
  ) {}

  /**
   * Use case: Member'ın üyeliğini iptal et
   * 
   * Orchestration:
   * 1. Member'ı repository'den al
   * 2. Domain Entity'de cancelMembership method'unu çağır (business rule'lar burada)
   * 3. Repository'ye kaydet
   * 4. History log
   */
  async cancelMembership(command: CancelMemberCommand): Promise<Member> {
    // 1. Member'ı bul
    const member = await this.memberRepository.findById(command.memberId);
    if (!member) {
      throw new NotFoundException(`Üye bulunamadı: ${command.memberId}`);
    }

    // 2. History için veriyi sakla
    const oldData = this.prepareHistoryData(member);

    try {
      // 3. Domain Entity'de cancelMembership method'unu çağır
      // Business rule'lar burada çalışır (status check, validation)
      member.cancelMembership(command.cancelledByUserId, {
        status: command.status,
        cancellationReason: command.cancellationReason,
      });

      // 4. Repository'ye kaydet
      await this.memberRepository.save(member);

      // 5. History log
      const newData = this.prepareHistoryData(member);
      await this.memberHistoryService.logMemberUpdate(
        member.id,
        command.cancelledByUserId,
        oldData,
        newData,
      );

      return member;
    } catch (error) {
      // Domain exception'ları HTTP exception'a çevir
      if (error instanceof MemberCannotBeCancelledException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof MemberCancellationReasonRequiredException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof MemberNotFoundException) {
        throw new NotFoundException(error.message);
      }
      // Diğer exception'ları re-throw et
      throw error;
    }
  }

  /**
   * History için data hazırla
   */
  private prepareHistoryData(member: Member): Record<string, any> {
    return {
      status: member.status.toString(),
      cancelledByUserId: member.cancelledByUserId,
      cancelledAt: member.cancelledAt,
      cancellationReason: member.cancellationReason,
    };
  }
}
