import { supabase } from "./supabase.js";

// Sauvegarder un échange en mémoire
export async function saveMemory(userEmail, agent, content) {
  try {
    await supabase.from("memories").insert({
      user_email: userEmail,
      agent,
      content,
    });
  } catch (e) {
    console.error("saveMemory error:", e);
  }
}

// Récupérer les derniers souvenirs
export async function getMemories(userEmail, agent = null, limit = 10) {
  try {
    let query = supabase
      .from("memories")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (agent) query = query.eq("agent", agent);
    const { data } = await query;
    return data || [];
  } catch (e) {
    return [];
  }
}

// Mettre à jour les préférences utilisateur
export async function updateUserPreferences(userEmail, prefs = {}, increment = false) {
  try {
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_email", userEmail)
      .single();

    const updated = {
      user_email: userEmail,
      favorite_team: prefs.favorite_team || existing?.favorite_team || "Chicago Bulls",
      favorite_players: prefs.favorite_players || existing?.favorite_players || [],
      topics_discussed: prefs.topics_discussed || existing?.topics_discussed || [],
      interaction_count: increment ? (existing?.interaction_count || 0) + 1 : existing?.interaction_count || 0,
      notes: prefs.notes || existing?.notes || "",
      last_seen: new Date().toISOString(),
    };

    await supabase.from("user_preferences").upsert(updated, { onConflict: "user_email" });
  } catch (e) {
    console.error("updateUserPreferences error:", e);
  }
}

// Récupérer les préférences utilisateur
export async function getUserPreferences(userEmail) {
  try {
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_email", userEmail)
      .single();
    return data || null;
  } catch (e) {
    return null;
  }
}

// Générer le contexte mémoire à injecter dans le system prompt
export async function buildMemoryContext(userEmail, agent) {
  try {
    const [prefs, memories] = await Promise.all([
      getUserPreferences(userEmail),
      getMemories(userEmail, agent, 5),
    ]);

    let context = "";

    if (prefs) {
      context += `\n\n=== PROFIL UTILISATEUR ===`;
      if (prefs.favorite_team) context += `\nÉquipe favorite: ${prefs.favorite_team}`;
      if (prefs.favorite_players?.length) context += `\nJoueurs favoris: ${prefs.favorite_players.join(", ")}`;
      if (prefs.interaction_count) context += `\nNombre d'interactions: ${prefs.interaction_count}`;
      if (prefs.notes) context += `\nNotes: ${prefs.notes}`;
    }

    if (memories.length > 0) {
      context += `\n\n=== HISTORIQUE RÉCENT ===`;
      memories.reverse().forEach(m => {
        context += `\n- ${m.content.slice(0, 120)}`;
      });
    }

    return context;
  } catch (e) {
    return "";
  }
}

// Détecter automatiquement les préférences depuis un message
export async function detectAndSavePreferences(userEmail, message) {
  try {
    const msg = message.toLowerCase();
    const prefs = {};

    const teams = ["bulls", "lakers", "warriors", "celtics", "heat", "knicks", "nets", "spurs", "nuggets", "bucks"];
    for (const team of teams) {
      if (msg.includes(team)) {
        const teamNames = {
          bulls: "Chicago Bulls", lakers: "L.A. Lakers", warriors: "Golden State Warriors",
          celtics: "Boston Celtics", heat: "Miami Heat", knicks: "New York Knicks",
          nets: "Brooklyn Nets", spurs: "San Antonio Spurs", nuggets: "Denver Nuggets", bucks: "Milwaukee Bucks"
        };
        prefs.favorite_team = teamNames[team];
        break;
      }
    }

    const players = ["lavine", "white", "vucevic", "jordan", "kobe", "lebron", "curry", "giannis", "durant"];
    const mentioned = players.filter(p => msg.includes(p));
    if (mentioned.length > 0) {
      const { data: existing } = await supabase.from("user_preferences").select("favorite_players").eq("user_email", userEmail).single();
      const current = existing?.favorite_players || [];
      prefs.favorite_players = [...new Set([...current, ...mentioned])];
    }

    if (Object.keys(prefs).length > 0) {
      await updateUserPreferences(userEmail, prefs, false);
    }
  } catch (e) {
    console.error("detectAndSavePreferences error:", e);
  }
}
