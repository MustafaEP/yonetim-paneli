/**
 * Member Rejection Application Service
 *
 * Use case: Member rejection işlemini orchestrate eder (PENDING/APPROVED → REJECTED)
 *
 * Sorumluluklar:
 * - Transaction yönetimi
 * - Domain Entity çağırma
 * - Cross-cutting concerns (history)
 * - Repository koordinasyonu
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Member } from '../../domain/entities/member.entity';
import type { MemberRepository } from '../../domain/repositories/member.repository.interface';
import { MemberHistoryService } from '../../member-history.service';
import {
  MemberNotFoundException,
  MemberCannotBeRejectedException,
} from '../../domain/exceptions/member-domain.exception';

export interface RejectMemberCommand {
  memberId: string;
  rejectedByUserId: string;
}

@Injectable()
export class MemberRejectionApplicationService {
  private readonly logger = new Logger(MemberRejectionApplicationService.name);

  constructor(
    @Inject('MemberRepository')
    private readonly memberRepository: MemberRepository,
    private readonly memberHistoryService: MemberHistoryService,
  ) {}

  /**
   * Use case: Member'ı reject et
   *
   * Orchestration:
   * 1. Member'ı repository'den al
   * 2. Domain Entity'de reject method'unu çağır (business rule'lar burada)
   * 3. Repository'ye kaydet
   * 4. History log
   */
  async rejectMember(command: RejectMemberCommand): Promise<Member> {
    // 1. Member'ı bul
    const member = await this.memberRepository.findById(command.memberId);
    if (!member) {
      throw new NotFoundException(`Üye bulunamadı: ${command.memberId}`);
    }

    // 2. History için veriyi sakla
    const oldData = this.prepareHistoryData(member);

    try {
      // 3. Domain Entity'de reject method'unu çağır
      // Business rule'lar burada çalışır (status check)
      member.reject(command.rejectedByUserId);

      // 4. Repository'ye kaydet
      await this.memberRepository.save(member);

      // 5. History log
      const newData = this.prepareHistoryData(member);
      await this.memberHistoryService.logMemberUpdate(
        member.id,
        command.rejectedByUserId,
        oldData,
        newData,
      );

      return member;
    } catch (error) {
      // Domain exception'ları HTTP exception'a çevir
      if (error instanceof MemberCannotBeRejectedException) {
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
      approvedByUserId: member.approvedByUserId,
      approvedAt: member.approvedAt,
    };
  }
}
