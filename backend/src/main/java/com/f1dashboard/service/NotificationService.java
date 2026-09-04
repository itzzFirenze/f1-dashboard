package com.f1dashboard.service;

import com.f1dashboard.dto.SubscriptionDto;
import com.f1dashboard.dto.SubscriptionResponseDto;
import com.f1dashboard.entity.NotificationSubscription;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.RaceSession;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.repository.NotificationSubscriptionRepository;
import com.f1dashboard.repository.RaceRepository;
import com.f1dashboard.repository.RaceSessionRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Handles subscription CRUD and fires scheduled email alerts.
 *
 * All scheduler comparisons use UTC because session times are stored as UTC.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

   private static final int CURRENT_SEASON = 2026;
   private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMMM d, yyyy");

   private final NotificationSubscriptionRepository subscriptionRepository;
   private final RaceRepository raceRepository;
   private final RaceSessionRepository raceSessionRepository;
   private final JavaMailSender mailSender;

   @Value("${spring.mail.username:}")
   private String fromEmail;

   @Value("${resend.api-key:${RESEND_API_KEY:}}")
   private String resendApiKey;

   @Value("${resend.from-email:${RESEND_FROM_EMAIL:onboarding@resend.dev}}")
   private String resendFromEmail;

   @Value("${app.frontend-url:http://localhost:5173}")
   private String frontendUrl;

   @jakarta.annotation.PostConstruct
   public void init() {
      if (resendApiKey != null && !resendApiKey.isBlank()) {
         log.info("[Notifications] Email alerts ENABLED via Resend HTTP API (from: {})", resendFromEmail);
      } else if (fromEmail != null && !fromEmail.isBlank()) {
         log.info("[Notifications] Email alerts ENABLED via SMTP sender: {}", fromEmail);
      } else {
         log.warn("[Notifications] Email alerts DISABLED: Neither RESEND_API_KEY nor MAIL_USERNAME is set.");
      }
   }

   // ──────────────────────────────────────────────────────────────────────────
   // Public API
   // ──────────────────────────────────────────────────────────────────────────

   /** Subscribe or update an existing subscription for the given email + race(s). */
   @Transactional
   public SubscriptionResponseDto subscribe(SubscriptionDto dto) {
      if (dto.isAllUpcoming()) {
         return subscribeAllUpcoming(dto);
      }

      if (dto.raceId() == null) {
         throw new IllegalArgumentException("Race ID is required when subscribing to a single race.");
      }

      Race race = raceRepository.findById(dto.raceId())
            .orElseThrow(() -> new IllegalArgumentException("Race not found: " + dto.raceId()));

      NotificationSubscription sub = subscriptionRepository
            .findByEmailAndRaceId(dto.email(), dto.raceId())
            .orElse(null);

      if (sub == null) {
         sub = NotificationSubscription.builder()
               .email(dto.email())
               .race(race)
               .notifyRaceWeek(dto.notifyRaceWeek())
               .notifyDayBefore(dto.notifyDayBefore())
               .notifyBeforeSession(dto.notifyBeforeSession())
               .build();
      } else {
         sub.setNotifyRaceWeek(dto.notifyRaceWeek());
         sub.setNotifyDayBefore(dto.notifyDayBefore());
         sub.setNotifyBeforeSession(dto.notifyBeforeSession());
      }

      sub = subscriptionRepository.save(sub);

      // Send confirmation email
      boolean emailSent = sendConfirmationEmail(sub, race);

      String confirmationMessage = emailSent
            ? "Subscribed successfully! Check your inbox for confirmation."
            : (!hasEmailConfigured()
                  ? "Subscribed! (Note: Server email not configured; no email sent.)"
                  : "Subscribed! (Note: Confirmation email failed to send. Check server logs.)");

      return toResponse(sub, race, confirmationMessage);
   }

   /** Subscribe user to all remaining / upcoming races in the season. */
   @Transactional
   public SubscriptionResponseDto subscribeAllUpcoming(SubscriptionDto dto) {
      LocalDate today = LocalDate.now(ZoneOffset.UTC);
      List<Race> upcomingRaces = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON)
            .stream()
            .filter(r -> r.getStatus() == RaceStatus.UPCOMING
                      || r.getStatus() == RaceStatus.IN_PROGRESS
                      || (r.getRaceDate() != null && !r.getRaceDate().isBefore(today)))
            .toList();

      if (upcomingRaces.isEmpty()) {
         upcomingRaces = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON);
      }

      String sharedToken = null;
      NotificationSubscription firstSub = null;

      for (Race race : upcomingRaces) {
         NotificationSubscription sub = subscriptionRepository
               .findByEmailAndRaceId(dto.email(), race.getId())
               .orElse(null);

         if (sub == null) {
            sub = NotificationSubscription.builder()
                  .email(dto.email())
                  .race(race)
                  .notifyRaceWeek(dto.notifyRaceWeek())
                  .notifyDayBefore(dto.notifyDayBefore())
                  .notifyBeforeSession(dto.notifyBeforeSession())
                  .build();
         } else {
            sub.setNotifyRaceWeek(dto.notifyRaceWeek());
            sub.setNotifyDayBefore(dto.notifyDayBefore());
            sub.setNotifyBeforeSession(dto.notifyBeforeSession());
         }

         sub = subscriptionRepository.save(sub);
         if (sharedToken == null) {
            sharedToken = sub.getUnsubscribeToken();
            firstSub = sub;
         }
      }

      // Send ONE single comprehensive confirmation email for all upcoming races
      boolean emailSent = sendConfirmationEmailAll(dto.email(), upcomingRaces, dto, sharedToken);

      String confirmationMessage = emailSent
            ? "Subscribed to all " + upcomingRaces.size() + " upcoming races! Check your inbox for confirmation."
            : (!hasEmailConfigured()
                  ? "Subscribed to all " + upcomingRaces.size() + " upcoming races! (Note: Server email not configured; no email sent.)"
                  : "Subscribed to all " + upcomingRaces.size() + " upcoming races! (Note: Confirmation email failed to send. Check server logs.)");

      return new SubscriptionResponseDto(
            firstSub != null ? firstSub.getId() : null,
            dto.email(),
            dto.raceId(),
            "All Upcoming Races (" + upcomingRaces.size() + " GPs)",
            true,
            dto.notifyRaceWeek(),
            dto.notifyDayBefore(),
            dto.notifyBeforeSession(),
            sharedToken,
            confirmationMessage,
            true,
            upcomingRaces.size()
      );
   }

   /** Remove a subscription by its unsubscribe token. */
   @Transactional
   public boolean unsubscribe(String token, boolean allRaces) {
      Optional<NotificationSubscription> sub = subscriptionRepository.findByUnsubscribeToken(token);
      if (sub.isPresent()) {
         if (allRaces) {
            subscriptionRepository.deleteAllByEmail(sub.get().getEmail());
         } else {
            subscriptionRepository.delete(sub.get());
         }
         return true;
      }
      return false;
   }

   /** Remove a single subscription by its token (backward compatibility). */
   @Transactional
   public boolean unsubscribe(String token) {
      return unsubscribe(token, false);
   }

   /** Remove all subscriptions for an email address. */
   @Transactional
   public boolean unsubscribeAllByEmail(String email) {
      List<NotificationSubscription> subs = subscriptionRepository.findAllByEmail(email);
      if (!subs.isEmpty()) {
         subscriptionRepository.deleteAll(subs);
         return true;
      }
      return false;
   }

   /** Check whether an email is subscribed to a specific race or all races. */
   @Transactional(readOnly = true)
   public SubscriptionResponseDto getStatus(String email, Long raceId) {
      List<NotificationSubscription> userSubs = subscriptionRepository.findAllByEmail(email);
      if (userSubs.isEmpty()) {
         Race race = raceId != null ? raceRepository.findById(raceId).orElse(null) : null;
         return new SubscriptionResponseDto(
               null, email, raceId, race != null ? race.getName() : null, false,
               true, true, true, null, "Not subscribed", false, 0
         );
      }

      int totalSubbed = userSubs.size();
      boolean allUpcoming = totalSubbed > 1;

      NotificationSubscription matchingSub = (raceId != null)
            ? userSubs.stream().filter(s -> s.getRace() != null && s.getRace().getId().equals(raceId)).findFirst().orElse(userSubs.get(0))
            : userSubs.get(0);

      Race race = (raceId != null) ? raceRepository.findById(raceId).orElse(null) : matchingSub.getRace();
      String raceName = allUpcoming ? "All Upcoming Races (" + totalSubbed + " GPs)" : (race != null ? race.getName() : "F1 Race");

      return new SubscriptionResponseDto(
            matchingSub.getId(),
            email,
            raceId,
            raceName,
            true,
            matchingSub.isNotifyRaceWeek(),
            matchingSub.isNotifyDayBefore(),
            matchingSub.isNotifyBeforeSession(),
            matchingSub.getUnsubscribeToken(),
            allUpcoming ? "Subscribed to " + totalSubbed + " upcoming races" : "Subscribed to " + raceName,
            allUpcoming,
            totalSubbed
      );
   }

   // ──────────────────────────────────────────────────────────────────────────
   // Scheduled jobs
   // ──────────────────────────────────────────────────────────────────────────

   /**
    * Runs daily at 08:00 UTC.
    * Sends "Race week begins!" alert when raceDate is exactly 7 days from today.
    */
   @Scheduled(cron = "0 0 8 * * *", zone = "UTC")
   @Transactional(readOnly = true)
   public void sendRaceWeekAlerts() {
      log.info("[Notifications] Checking race week alerts...");
      LocalDate target = LocalDate.now(ZoneOffset.UTC).plusDays(7);
      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON);
      for (Race race : races) {
         if (target.equals(race.getRaceDate())) {
            List<NotificationSubscription> subs = subscriptionRepository.findAllByRaceId(race.getId());
            for (NotificationSubscription sub : subs) {
               if (sub.isNotifyRaceWeek()) {
                  sendRaceWeekEmail(sub, race);
               }
            }
         }
      }
   }

   /**
    * Runs daily at 08:00 UTC.
    * Sends "Tomorrow is race day!" alert when raceDate is exactly 1 day from today.
    */
   @Scheduled(cron = "0 0 8 * * *", zone = "UTC")
   @Transactional(readOnly = true)
   public void sendDayBeforeAlerts() {
      log.info("[Notifications] Checking day-before alerts...");
      LocalDate tomorrow = LocalDate.now(ZoneOffset.UTC).plusDays(1);
      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON);
      for (Race race : races) {
         if (tomorrow.equals(race.getRaceDate())) {
            List<NotificationSubscription> subs = subscriptionRepository.findAllByRaceId(race.getId());
            for (NotificationSubscription sub : subs) {
               if (sub.isNotifyDayBefore()) {
                  sendDayBeforeEmail(sub, race);
               }
            }
         }
      }
   }

   /**
    * Runs every minute.
    * Sends "Session starts in 5 min!" for any session whose UTC start is
    * within the next 5–6 minutes (one-minute window avoids double-firing).
    */
   @Scheduled(cron = "0 * * * * *")
   @Transactional(readOnly = true)
   public void sendSessionAlerts() {
      LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
      LocalDateTime windowStart = nowUtc.plusMinutes(5);
      LocalDateTime windowEnd = nowUtc.plusMinutes(6);

      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON);
      for (Race race : races) {
         List<RaceSession> sessions = raceSessionRepository
               .findByRaceIdOrderBySessionDateAscSessionTimeAsc(race.getId());
         for (RaceSession session : sessions) {
            if (session.getSessionDate() == null || session.getSessionTime() == null) continue;
            LocalDateTime sessionDt = LocalDateTime.of(session.getSessionDate(), session.getSessionTime());
            if (!sessionDt.isBefore(windowStart) && sessionDt.isBefore(windowEnd)) {
               List<NotificationSubscription> subs = subscriptionRepository.findAllByRaceId(race.getId());
               for (NotificationSubscription sub : subs) {
                  if (sub.isNotifyBeforeSession()) {
                     sendSessionEmail(sub, race, session);
                  }
               }
            }
         }
      }
   }

   // ──────────────────────────────────────────────────────────────────────────
   // Email senders
   // ──────────────────────────────────────────────────────────────────────────

   private boolean sendConfirmationEmail(NotificationSubscription sub, Race race) {
      String subject = "🏁 F1 Alerts confirmed — " + race.getName();
      String html = buildEmailHtml(
            "You're on the grid!",
            "You're now subscribed to race alerts for <strong>" + race.getName() + "</strong>.",
            buildAlertList(sub),
            sub.getUnsubscribeToken()
      );
      return sendHtml(sub.getEmail(), subject, html);
   }

   private boolean sendConfirmationEmailAll(String email, List<Race> races, SubscriptionDto dto, String token) {
      StringBuilder raceRows = new StringBuilder();
      int displayLimit = Math.min(races.size(), 12);
      for (int i = 0; i < displayLimit; i++) {
         Race r = races.get(i);
         String dateStr = r.getRaceDate() != null ? r.getRaceDate().format(DATE_FMT) : "TBC";
         raceRows.append("<tr style='border-bottom:1px solid rgba(255,255,255,0.06);'>")
                 .append("<td style='padding:8px 0;color:#fff;font-weight:600;'>Round ").append(r.getRound()).append(": ").append(r.getName()).append("</td>")
                 .append("<td style='padding:8px 0;text-align:right;color:#a0aec0;font-family:monospace;font-size:12px;'>").append(dateStr).append("</td>")
                 .append("</tr>");
      }
      if (races.size() > displayLimit) {
         raceRows.append("<tr><td colspan='2' style='padding:8px 0;color:#e10600;font-size:12px;font-style:italic;'>")
                 .append("+ ").append(races.size() - displayLimit).append(" more upcoming Grands Prix on the calendar")
                 .append("</td></tr>");
      }

      String scheduleBox = """
            <div style='margin:16px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;'>
               <div style='color:#e10600;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;'>
                  🗓️ Scheduled Telemetry Coverage (%d Upcoming Races)
               </div>
               <table style='width:100%%;border-collapse:collapse;font-size:13px;'>
                  %s
               </table>
            </div>
            """.formatted(races.size(), raceRows.toString());

      StringBuilder alerts = new StringBuilder("<ul style='color:#a0aec0;font-size:14px;padding-left:20px;margin:0 0 16px;'>");
      if (dto.notifyRaceWeek())      alerts.append("<li>🏁 Race week kickoff alert (7 days before lights out)</li>");
      if (dto.notifyDayBefore())     alerts.append("<li>📅 24-hour race day countdown briefing</li>");
      if (dto.notifyBeforeSession()) alerts.append("<li>⏱️ 5-minute green-flag warnings before all sessions</li>");
      alerts.append("</ul>");

      String extra = scheduleBox + alerts.toString();
      String html = buildEmailHtml(
            "Full Season Telemetry Activated!",
            "You have unlocked full-season race alert coverage. You will receive telemetry notifications for all <strong>"
                  + races.size() + " upcoming Grands Prix</strong> in the " + CURRENT_SEASON + " season.",
            extra,
            token
      );
      String subject = "🏎️ Season Pass Confirmed — Alerts for all " + races.size() + " upcoming races";
      return sendHtml(email, subject, html);
   }

   private void sendRaceWeekEmail(NotificationSubscription sub, Race race) {
      String subject = "🚦 Race Week! " + race.getName() + " starts in 7 days";
      String html = buildEmailHtml(
            "Race Week is Here",
            "The <strong>" + race.getName() + "</strong> weekend begins in just 7 days at <em>"
                  + (race.getCircuit() != null ? race.getCircuit().getName() : "the circuit") + "</em>.",
            "<p style='color:#a0aec0;font-size:14px;margin:0 0 16px;'>Race day: <strong style='color:#fff'>"
                  + (race.getRaceDate() != null ? race.getRaceDate().format(DATE_FMT) : "TBC") + "</strong></p>",
            sub.getUnsubscribeToken()
      );
      sendHtml(sub.getEmail(), subject, html);
   }

   private void sendDayBeforeEmail(NotificationSubscription sub, Race race) {
      String subject = "🏎️ Tomorrow is Race Day — " + race.getName();
      String html = buildEmailHtml(
            "Tomorrow is Race Day!",
            "Get ready — <strong>" + race.getName() + "</strong> is tomorrow!",
            "<p style='color:#a0aec0;font-size:14px;margin:0 0 16px;'>Circuit: <strong style='color:#fff'>"
                  + (race.getCircuit() != null ? race.getCircuit().getName() : "TBC") + "</strong></p>",
            sub.getUnsubscribeToken()
      );
      sendHtml(sub.getEmail(), subject, html);
   }

   private void sendSessionEmail(NotificationSubscription sub, Race race, RaceSession session) {
      String sessionName = session.getSessionType().getDisplayName();
      String subject = "⏱️ " + sessionName + " starts in 5 minutes — " + race.getName();
      String html = buildEmailHtml(
            sessionName + " — 5 Minutes to Go!",
            "<strong>" + sessionName + "</strong> for the <strong>" + race.getName()
                  + "</strong> is about to begin!",
            "<p style='color:#a0aec0;font-size:14px;margin:0 0 16px;'>Start time (UTC): <strong style='color:#fff'>"
                  + session.getSessionDate() + " " + session.getSessionTime() + "</strong></p>",
            sub.getUnsubscribeToken()
      );
      sendHtml(sub.getEmail(), subject, html);
   }

   private boolean hasEmailConfigured() {
      return (resendApiKey != null && !resendApiKey.isBlank())
            || (fromEmail != null && !fromEmail.isBlank());
   }

   private boolean sendViaResend(String to, String subject, String html) {
      try {
         String sender = resendFromEmail != null && resendFromEmail.contains("<")
               ? resendFromEmail
               : "F1 Dashboard <" + (resendFromEmail != null && !resendFromEmail.isBlank() ? resendFromEmail : "onboarding@resend.dev") + ">";

         Map<String, Object> payload = Map.of(
               "from", sender,
               "to", List.of(to),
               "subject", subject,
               "html", html
         );

         RestClient restClient = RestClient.builder()
               .baseUrl("https://api.resend.com")
               .defaultHeader("Authorization", "Bearer " + resendApiKey.trim())
               .defaultHeader("Content-Type", "application/json")
               .build();

         String response = restClient.post()
               .uri("/emails")
               .body(payload)
               .retrieve()
               .body(String.class);

         log.info("[Notifications] Successfully sent email via Resend API to {}: {}", to, response);
         return true;
      } catch (Exception e) {
         log.error("[Notifications] Failed to send email via Resend to {}: {}", to, e.getMessage(), e);
         return false;
      }
   }

   private boolean sendHtml(String to, String subject, String html) {
      // 1. If Resend API key is present, use HTTP REST API (port 443 - works on Render Free)
      if (resendApiKey != null && !resendApiKey.isBlank()) {
         return sendViaResend(to, subject, html);
      }

      // 2. Otherwise fall back to SMTP (Gmail)
      if (fromEmail == null || fromEmail.isBlank()) {
         log.warn("[Notifications] Neither RESEND_API_KEY nor MAIL_USERNAME is configured — skipping email to {}", to);
         return false;
      }
      try {
         MimeMessage msg = mailSender.createMimeMessage();
         MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
         try {
            helper.setFrom(fromEmail, "F1 Dashboard");
         } catch (Exception ex) {
            helper.setFrom(fromEmail);
         }
         helper.setTo(to);
         helper.setSubject(subject);
         helper.setText(html, true);
         mailSender.send(msg);
         log.info("[Notifications] Successfully sent '{}' to {}", subject, to);
         return true;
      } catch (Exception e) {
         log.error("[Notifications] Failed to send email to {}: {}", to, e.getMessage(), e);
         return false;
      }
   }

   // ──────────────────────────────────────────────────────────────────────────
   // HTML template builder
   // ──────────────────────────────────────────────────────────────────────────

   private String buildAlertList(NotificationSubscription sub) {
      StringBuilder sb = new StringBuilder(
            "<ul style='color:#a0aec0;font-size:14px;padding-left:20px;margin:0 0 16px;'>");
      if (sub.isNotifyRaceWeek())      sb.append("<li>🏁 Race week starts (7 days before)</li>");
      if (sub.isNotifyDayBefore())     sb.append("<li>📅 Day before the race</li>");
      if (sub.isNotifyBeforeSession()) sb.append("<li>⏱️ 5 minutes before each session</li>");
      sb.append("</ul>");
      return sb.toString();
   }

   private String buildEmailHtml(String headline, String body, String extra, String token) {
      String unsubUrl = frontendUrl + "/unsubscribe/" + token;
      return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:linear-gradient(135deg,#111113 0%%,#18181b 100%%);
                                border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;
                                max-width:600px;width:100%%;">
                    <!-- Red accent bar -->
                    <tr><td style="background:linear-gradient(90deg,#e10600,#ff2400);height:4px;"></td></tr>
                    <!-- Header -->
                    <tr><td style="padding:32px 40px 24px;">
                      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="color:#e10600;font-size:22px;">⬡</span>
                        <span style="color:#fff;font-size:18px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;">
                          F1 Dashboard
                        </span>
                      </div>
                      <div style="width:40px;height:2px;background:#e10600;margin-top:4px;"></div>
                    </td></tr>
                    <!-- Body -->
                    <tr><td style="padding:0 40px 32px;">
                      <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 16px;
                                 text-transform:uppercase;letter-spacing:0.05em;">
                        %s
                      </h1>
                      <p style="color:#a0aec0;font-size:15px;line-height:1.6;margin:0 0 20px;">%s</p>
                      %s
                      <a href="%s"
                         style="display:inline-block;background:#e10600;color:#fff;font-size:14px;
                                font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;
                                text-transform:uppercase;letter-spacing:0.1em;">
                        View Dashboard
                      </a>
                    </td></tr>
                    <!-- Footer -->
                    <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                      <p style="color:#4a5568;font-size:12px;margin:0;">
                        You received this alert because you subscribed on F1 Dashboard.<br>
                        <a href="%s" style="color:#6b7280;text-decoration:underline;">Unsubscribe from all alerts for this race</a>
                      </p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(headline, body, extra, frontendUrl, unsubUrl);
   }

   // ──────────────────────────────────────────────────────────────────────────
   // Helpers
   // ──────────────────────────────────────────────────────────────────────────

   private SubscriptionResponseDto toResponse(NotificationSubscription sub, Race race, String message) {
      return new SubscriptionResponseDto(
            sub.getId(),
            sub.getEmail(),
            race.getId(),
            race.getName(),
            true,
            sub.isNotifyRaceWeek(),
            sub.isNotifyDayBefore(),
            sub.isNotifyBeforeSession(),
            sub.getUnsubscribeToken(),
            message
      );
   }
}
