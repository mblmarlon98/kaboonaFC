-- Seed default homepage content so the site has content on first load
INSERT INTO public.site_content (key, value) VALUES
  ('hero', '{
    "clubName": "KABOONA",
    "clubSuffix": "FC",
    "tagline": "Rise to Glory",
    "ctaText1": "Join the Team",
    "ctaText2": "Become a Fan"
  }'::jsonb),
  ('about', '{
    "badge": "ABOUT THE CLUB",
    "title": "Kaboona FC",
    "location": "Kuala Lumpur, Malaysia",
    "description": "Founded with passion and driven by ambition, Kaboona FC is more than just a football club. We are a community of players, fans, and supporters united by our love for the beautiful game.",
    "image": "",
    "stat1Value": "2024",
    "stat1Label": "Founded",
    "stat2Value": "30+",
    "stat2Label": "Players",
    "stat3Value": "3",
    "stat3Label": "Divisions",
    "stat4Value": "1",
    "stat4Label": "Community"
  }'::jsonb),
  ('glory', '{
    "badge": "GLORY SECTION",
    "heading": "League Standing",
    "leagueTitle": "The New Camp Edition (Division 3)",
    "achievementsBadge": "ACHIEVEMENTS",
    "achievementsHeading": "Our Stars",
    "shameBadge": "HALL OF INFAMY",
    "shameHeading": "Wall of Shame"
  }'::jsonb),
  ('training', '{
    "badge": "TRAINING GROUND",
    "title": "Where Champions Are Made",
    "description": "Our training facility is where raw talent meets disciplined preparation. Every session brings us closer to glory.",
    "image": "",
    "feature1": "Professional-grade training pitch",
    "feature2": "Weekly structured training sessions",
    "feature3": "Tactical analysis and video review",
    "feature4": "Fitness and conditioning programs",
    "groundLabel": "Kaboona FC Training Ground",
    "lat": "3.0673",
    "lng": "101.6038"
  }'::jsonb),
  ('team_preview', '{
    "badge": "OUR STAFF",
    "heading": "Meet Our Team",
    "description": "The people who lead, manage, and coach Kaboona FC to success."
  }'::jsonb),
  ('cta', '{
    "badge": "GET INVOLVED",
    "heading": "Join the Pride",
    "description": "Whether you want to play or support from the sidelines, there''s a place for you at Kaboona FC.",
    "card1Subtitle": "Become a Player",
    "card1Title": "Join the Team",
    "card1Description": "Ready to take your game to the next level? Create an account and request to join the Kaboona FC squad.",
    "card1ButtonText": "Sign Up Now",
    "card2Subtitle": "Join the Community",
    "card2Title": "Become a Fan",
    "card2Description": "Support Kaboona FC from the stands! Get exclusive content, match updates, and be part of our growing fanbase.",
    "card2ButtonText": "Join Fan Portal",
    "stat1Value": "100+",
    "stat1Label": "Active Members",
    "stat2Value": "50+",
    "stat2Label": "Training Sessions",
    "stat3Value": "3",
    "stat3Label": "Competitive Teams",
    "stat4Value": "1",
    "stat4Label": "United Community"
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
