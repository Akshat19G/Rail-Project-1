import { createServerFn } from "@tanstack/react-start";

import { DEMO_CREDENTIALS } from "./railcare-demo";

/**
 * Ensures the two demo accounts exist as real, confirmed accounts with their
 * profile and journey rows. Safe to call repeatedly — it is idempotent.
 */
export const ensureDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const seeds = [
    {
      creds: DEMO_CREDENTIALS.passenger,
      profile: {
        role: "passenger" as const,
        full_name: "Amit Sharma",
        mobile: "+91 90000 11122",
        email: DEMO_CREDENTIALS.passenger.email,
        age: 54,
        blood_group: "B+",
        emergency_contact: "Meera Sharma · +91 90000 33344",
        allergies: "",
        is_responder: false,
      },
      journey: { coach: "B2", seat: "41", available: false },
    },
    {
      creds: DEMO_CREDENTIALS.doctor,
      profile: {
        role: "doctor" as const,
        full_name: "Dr. Ananya Sharma",
        mobile: "+91 90000 55566",
        email: DEMO_CREDENTIALS.doctor.email,
        specialization: "Cardiologist",
        is_responder: true,
      },
      journey: { coach: "B3", seat: "28", available: true },
    },
  ];

  for (const seed of seeds) {
    let userId: string | undefined;

    const created = await supabaseAdmin.auth.admin.createUser({
      email: seed.creds.email,
      password: seed.creds.password,
      email_confirm: true,
    });

    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      // Already exists — find it.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = list?.users.find((u) => u.email === seed.creds.email)?.id;
      if (userId) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: seed.creds.password,
          email_confirm: true,
        });
      }
    }

    if (!userId) continue;

    await supabaseAdmin.from("profiles").upsert({ id: userId, ...seed.profile }, { onConflict: "id" });

    const { data: existingJourney } = await supabaseAdmin
      .from("journeys")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingJourney) {
      await supabaseAdmin.from("journeys").update({ role: seed.profile.role, ...seed.journey }).eq("id", existingJourney.id);
    } else {
      await supabaseAdmin.from("journeys").insert({ user_id: userId, role: seed.profile.role, ...seed.journey });
    }
  }

  return { ok: true };
});
