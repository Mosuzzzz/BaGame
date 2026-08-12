import re
with open('frontend/src/app/edit/[id]/page.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace("import { submitGame } from '@/lib/api';", "import { editGame, getGameById } from '@/lib/api';")
content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useParams } from 'next/navigation';")

# Replace function signature
content = content.replace("export default function SubmitGamePage() {", "export default function EditGamePage() {\n  const { id } = useParams() as { id: string };\n  const [isFetching, setIsFetching] = useState(true);\n  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);\n")

# Add useEffect to fetch game
use_effect = """
  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await getGameById(id);
        const game = res.game;
        
        // Verify owner
        if (user && user.displayName !== game.creator_id && user.displayName !== 'Admin') {
          router.push('/');
          return;
        }

        setCustomTitle(game.title);
        setCustomDescription(game.description);
        setSelectedTags(game.tags);
        setGameUrl(game.original_url || '');
        setWebsiteUrl(game.website_url || '');
        setExistingThumbnailUrl(game.thumbnail_url);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    }
    if (user && id) {
      fetchGame();
    }
  }, [id, user, router]);
"""
content = content.replace("  const router = useRouter();", "  const router = useRouter();\n" + use_effect)

# Remove required validation for coverImage since they can keep the existing one
content = content.replace("if (!coverImage) throw new Error('Please select a cover image');", "// if (!coverImage) ... (optional now)")

# Update Cloudinary upload to only happen if coverImage exists
content = re.sub(
    r"const coverFormData = new FormData\(\);.*?const custom_thumbnail_url = coverData\.secure_url;",
    """let custom_thumbnail_url = existingThumbnailUrl || '';
      if (coverImage) {
        const coverFormData = new FormData();
        coverFormData.append('file', coverImage);
        coverFormData.append('upload_preset', uploadPreset);
        const coverRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: coverFormData,
        });
        if (!coverRes.ok) {
          const errObj = await coverRes.json().catch(() => ({}));
          throw new Error(`Cloudinary Error: ${errObj?.error?.message || 'Failed to upload cover image'}`);
        }
        const coverData = await coverRes.json();
        custom_thumbnail_url = coverData.secure_url;
      }""",
    content,
    flags=re.DOTALL
)

# Replace submitGame with editGame
content = content.replace("await submitGame({", "await editGame(id, {")
content = content.replace("const res = await submitGame(", "const res = await editGame(id, ")
content = content.replace("token // Pass the token", "}, token")

# Replace Title text
content = content.replace("Submit Your Game", "Edit Your Game")
content = content.replace("Share your game with", "Update your game details for")

# Fix cover image preview logic
content = content.replace(
    "src={URL.createObjectURL(coverImage)}",
    "src={coverImage ? URL.createObjectURL(coverImage) : (existingThumbnailUrl || '')}"
)
content = content.replace(
    "{coverImage && (",
    "{(coverImage || existingThumbnailUrl) && ("
)
content = content.replace(
    "required\n                      />",
    "/>"
) # remove required from file input

# Wrap the main container with an if(isFetching) loader
content = content.replace(
    "return (\n    <div",
    "if (isFetching) return <div className=\"flex items-center justify-center min-h-screen\"><p className=\"text-white\">Loading...</p></div>;\n\n  return (\n    <div"
)

with open('frontend/src/app/edit/[id]/page.tsx', 'w') as f:
    f.write(content)
