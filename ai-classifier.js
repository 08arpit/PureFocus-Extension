// AI-Powered Video Classification
// This module uses a lightweight approach to AI classification

class AIVideoClassifier {
  constructor() {
    // Pre-trained weights/patterns based on common YouTube video patterns
    this.educationalPatterns = this.loadEducationalPatterns();
    this.distractingPatterns = this.loadDistractingPatterns();
  }

  // Load patterns (these could be trained on actual video data)
  loadEducationalPatterns() {
    return {
      // Strong educational indicators (weight: high)
      strong: [
        { pattern: /^(tutorial|course|lecture|lesson|guide|how to)/i, weight: 5 },
        { pattern: /\b(learn|study|teach|explain|understand|master)\b/i, weight: 4 },
        { pattern: /\b(full course|complete tutorial|step by step|beginner|intermediate|advanced)\b/i, weight: 4 },
        { pattern: /\b(university|college|academy|institute|school)\b/i, weight: 3 },
        { pattern: /\b(curriculum|syllabus|module|chapter|part \d+)\b/i, weight: 3 },
      ],
      // Subject-specific patterns
      subject: [
        { pattern: /\b(math|mathematics|calculus|algebra|geometry|statistics)\b/i, weight: 4 },
        { pattern: /\b(programming|coding|software|development|algorithm|data structure)\b/i, weight: 4 },
        { pattern: /\b(physics|chemistry|biology|science)\b/i, weight: 3 },
        { pattern: /\b(history|philosophy|psychology|economics|literature)\b/i, weight: 3 },
      ],
      // Educational platforms
      platforms: [
        { pattern: /\b(khan academy|coursera|edx|udemy|codecademy|freecodecamp)\b/i, weight: 5 },
        { pattern: /\b(mit|harvard|stanford|cambridge|oxford)\b/i, weight: 5 },
      ]
    };
  }

  loadDistractingPatterns() {
    return {
      // Strong distracting indicators
      strong: [
        { pattern: /\b(meme|funny|hilarious|comedy|laugh|joke)\b/i, weight: 5 },
        { pattern: /\b(compilation|best moments|highlights|montage)\b/i, weight: 4 },
        { pattern: /\b(prank|challenge|dare|experiment)\b/i, weight: 4 },
        { pattern: /\b(vlog|daily vlog|lifestyle|routine)\b/i, weight: 3 },
      ],
      // Social media patterns
      social: [
        { pattern: /\b(tiktok|shorts|reels|viral|trending)\b/i, weight: 4 },
        { pattern: /\b(react|reaction|reacting)\b/i, weight: 3 },
      ],
      // Entertainment
      entertainment: [
        { pattern: /\b(music video|mv|song|concert)\b/i, weight: 3 },
        { pattern: /\b(unboxing|haul|shopping|review)\b/i, weight: 2 },
      ],
      // Gaming (non-educational)
      gaming: [
        { pattern: /\b(let's play|gameplay|speedrun)\b/i, weight: 3 },
        { pattern: /\b(twitch stream|livestream|e-sports)\b/i, weight: 3 },
      ]
    };
  }

  // AI Classification using weighted pattern matching
  async classifyVideo(title, description, channel) {
    const context = this.extractContext(title, description, channel);
    
    // Score using pattern matching
    const educationalScore = this.scoreEducationalPatterns(context);
    const distractingScore = this.scoreDistractingPatterns(context);
    
    // Apply contextual adjustments
    const adjustedScores = this.applyContextualAdjustments(
      educationalScore,
      distractingScore,
      context
    );
    
    // Make classification decision
    const confidence = this.calculateConfidence(adjustedScores);
    const isEducational = adjustedScores.educational > adjustedScores.distracting;
    
    return {
      isEducational,
      confidence,
      educationalScore: adjustedScores.educational,
      distractingScore: adjustedScores.distracting,
      reasoning: this.generateReasoning(adjustedScores, context)
    };
  }

  extractContext(title, description, channel) {
    const text = `${title} ${description}`.toLowerCase();
    const channelLower = channel.toLowerCase();
    
    return {
      text,
      channel: channelLower,
      title,
      description: description.substring(0, 500), // First 500 chars
      wordCount: text.split(/\s+/).length,
      hasNumbers: /\d+/.test(title),
      hasYear: /\b(202\d|202\d)\b/.test(text),
      hasAcronyms: /\b[A-Z]{2,}\b/.test(title),
    };
  }

  scoreEducationalPatterns(context) {
    let score = 0;
    const allPatterns = [
      ...this.educationalPatterns.strong,
      ...this.educationalPatterns.subject,
      ...this.educationalPatterns.platforms
    ];
    
    for (const { pattern, weight } of allPatterns) {
      if (pattern.test(context.text) || pattern.test(context.channel)) {
        score += weight;
      }
    }
    
    // Bonus for channels with educational keywords
    if (/\b(university|college|academy|institute|education|learning)\b/i.test(context.channel)) {
      score += 3;
    }
    
    return score;
  }

  scoreDistractingPatterns(context) {
    let score = 0;
    const allPatterns = [
      ...this.distractingPatterns.strong,
      ...this.distractingPatterns.social,
      ...this.distractingPatterns.entertainment,
      ...this.distractingPatterns.gaming
    ];
    
    for (const { pattern, weight } of allPatterns) {
      if (pattern.test(context.text)) {
        score += weight;
      }
    }
    
    return score;
  }

  applyContextualAdjustments(eduScore, distScore, context) {
    let educational = eduScore;
    let distracting = distScore;
    
    // Context-based adjustments using "AI-like" rules
    
    // If title has numbers, it might be a series/course (more educational)
    if (context.hasNumbers && /\b(part|episode|lesson|tutorial|course)\b/i.test(context.text)) {
      educational += 2;
    }
    
    // Professional/technical language indicates educational content
    if (/\b(function|variable|method|class|object|protocol|interface)\b/i.test(context.text)) {
      educational += 2;
    }
    
    // Duration in title often indicates educational (lectures, courses)
    if (/\b(\d+\s*min|\d+\s*hour|\d+\s*hr)\b/i.test(context.title)) {
      educational += 1;
    }
    
    // Clickbait patterns (distracting)
    if (/\b(you won't believe|shocking|exposed|truth|hacked)\b/i.test(context.text)) {
      distracting += 3;
    }
    
    // Entertainment-focused patterns
    if (/\b(try not to laugh|cry|blink|smile)\b/i.test(context.text)) {
      distracting += 2;
    }
    
    // Mixed signals: if both educational and distracting patterns exist
    if (educational > 5 && distracting > 5) {
      // Resolve ambiguity based on strongest signal
      const ratio = educational / (distracting + 1);
      if (ratio < 1.5) {
        // Close match, apply additional scrutiny
        if (context.hasYear || context.hasNumbers) {
          educational += 1; // Series/dated content often educational
        }
      }
    }
    
    return { educational, distracting };
  }

  calculateConfidence(scores) {
    const total = scores.educational + scores.distracting;
    if (total === 0) return 0.5; // Neutral confidence
    
    const difference = Math.abs(scores.educational - scores.distracting);
    const confidence = Math.min(difference / total, 1.0);
    
    return Math.max(0.5, confidence); // Minimum 50% confidence
  }

  generateReasoning(scores, context) {
    const reasons = [];
    
    if (scores.educational > scores.distracting) {
      reasons.push(`Educational indicators (${scores.educational}) outweigh distracting (${scores.distracting})`);
      
      if (scores.educational > 15) {
        reasons.push('Strong educational signals detected');
      }
      
      if (/\b(university|college|academy)\b/i.test(context.channel)) {
        reasons.push('From verified educational channel');
      }
    } else {
      reasons.push(`Distracting indicators (${scores.distracting}) outweigh educational (${scores.educational})`);
      
      if (scores.distracting > 15) {
        reasons.push('Strong distracting signals detected');
      }
    }
    
    return reasons.join('. ');
  }
}

// Export for use in YouTube content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIVideoClassifier;
}

