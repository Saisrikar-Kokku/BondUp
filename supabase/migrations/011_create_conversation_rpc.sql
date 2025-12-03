-- Create a secure function to create conversations
-- This bypasses RLS issues where a user can't see the conversation they just created
-- because they haven't been added as a participant yet.

CREATE OR REPLACE FUNCTION create_new_conversation(other_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Insert conversation
  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO new_id;

  -- Insert participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (new_id, current_user_id),
    (new_id, other_user_id);

  -- Return the new conversation object
  RETURN json_build_object('id', new_id, 'created_at', NOW(), 'updated_at', NOW());
END;
$$;
