-- Delete your personal tasting notes
DELETE FROM tasting_notes WHERE user_id = 'a875f8c3-fc53-4671-936c-cb2c61513564';

-- Delete guest session tasting notes
DELETE FROM tasting_notes WHERE guest_session_id IS NOT NULL;

-- Delete your wishlists
DELETE FROM wishlists WHERE user_id = 'a875f8c3-fc53-4671-936c-cb2c61513564';

-- Delete your user sets
DELETE FROM user_sets WHERE user_id = 'a875f8c3-fc53-4671-936c-cb2c61513564';

-- Delete your user whiskies
DELETE FROM user_whiskies WHERE user_id = 'a875f8c3-fc53-4671-936c-cb2c61513564';

-- Delete your social posts
DELETE FROM social_posts WHERE user_id = 'a875f8c3-fc53-4671-936c-cb2c61513564';

-- Delete your comments
DELETE FROM comments WHERE user_id = 'a875f8c3-fc53-4671-936c-cb2c61513564';