"""
Gaze Optimizer Agent - Fetch.ai uAgent
Cal Hacks 12.0 - UNIQUE VALUE PROPOSITION

This agent analyzes eye-tracking data to provide UX optimization suggestions.
This is what sets ClientSight apart from other component generators!
"""

from uagents import Agent, Context, Model
from typing import List, Dict, Optional
import statistics
import math

# Message Models
class GazePoint(Model):
    """Single gaze data point"""
    x: float
    y: float
    timestamp: int
    confidence: float

class OptimizationSuggestion(Model):
    """UX optimization suggestion"""
    issue: str
    recommendation: str
    code: Optional[str] = None
    estimated_impact: int  # Percentage
    severity: str  # 'low', 'medium', 'high'

class GazeOptimizationRequest(Model):
    """Request to analyze gaze data"""
    request_id: str
    component_id: str
    current_code: str
    gaze_data: List[GazePoint]

class GazeOptimizationResponse(Model):
    """Response with optimization suggestions"""
    request_id: str
    suggestions: List[OptimizationSuggestion]
    predicted_impact: int  # Overall % improvement
    priority: str  # 'low', 'medium', 'high'
    heatmap_zones: Optional[Dict] = None
    error: Optional[str] = None

# Create Gaze Optimizer Agent
gaze_optimizer = Agent(
    name="gaze_optimizer",
    port=8002,
    seed="gaze_optimizer_seed_phrase_calhacks",
    endpoint=["http://localhost:8002/submit"],
)

@gaze_optimizer.on_event("startup")
async def introduce(ctx: Context):
    """Announce agent on startup"""
    ctx.logger.info(f"👁️  Gaze Optimizer Agent started")
    ctx.logger.info(f"📍 Address: {gaze_optimizer.address}")
    ctx.logger.info(f"🔌 Endpoint: http://localhost:8002")

@gaze_optimizer.on_message(model=GazeOptimizationRequest)
async def handle_optimization_request(ctx: Context, sender: str, msg: GazeOptimizationRequest):
    """
    Handle gaze optimization requests
    
    This is the CORE INNOVATION that wins Cal Hacks prizes!
    """
    ctx.logger.info(f"👁️  Analyzing {len(msg.gaze_data)} gaze points for component {msg.component_id}")
    
    try:
        # Analyze gaze patterns
        suggestions = []
        
        # 1. Analyze attention distribution
        attention_suggestions = analyze_attention_distribution(msg.gaze_data)
        suggestions.extend(attention_suggestions)
        
        # 2. Analyze scanpath complexity
        scanpath_suggestions = analyze_scanpath(msg.gaze_data)
        suggestions.extend(scanpath_suggestions)
        
        # 3. Analyze dwell times
        dwell_suggestions = analyze_dwell_times(msg.gaze_data)
        suggestions.extend(dwell_suggestions)
        
        # 4. Analyze confidence (tracking quality)
        confidence_suggestions = analyze_tracking_quality(msg.gaze_data)
        suggestions.extend(confidence_suggestions)
        
        # 5. Generate heatmap zones
        heatmap = generate_heatmap_zones(msg.gaze_data)
        
        # Calculate overall priority
        high_severity = sum(1 for s in suggestions if s.severity == 'high')
        priority = 'high' if high_severity > 0 else ('medium' if len(suggestions) > 2 else 'low')
        
        # Calculate predicted impact
        predicted_impact = sum(s.estimated_impact for s in suggestions) // max(len(suggestions), 1)
        
        response_msg = GazeOptimizationResponse(
            request_id=msg.request_id,
            suggestions=suggestions,
            predicted_impact=min(predicted_impact, 50),  # Cap at 50%
            priority=priority,
            heatmap_zones=heatmap
        )
        
        ctx.logger.info(f"[OK] Found {len(suggestions)} optimization opportunities")
        
    except Exception as e:
        ctx.logger.error(f"[ERROR] Optimization failed: {str(e)}")
        response_msg = GazeOptimizationResponse(
            request_id=msg.request_id,
            suggestions=[],
            predicted_impact=0,
            priority='low',
            error=str(e)
        )
    
    # Send response back
    await ctx.send(sender, response_msg)

def analyze_attention_distribution(gaze_data: List[GazePoint]) -> List[OptimizationSuggestion]:
    """Analyze where users are looking"""
    suggestions = []
    
    if not gaze_data:
        return suggestions
    
    # Divide screen into quadrants
    viewport_width = 1920  # Assume standard desktop
    viewport_height = 1080
    
    quadrants = {
        'top-left': 0, 'top-right': 0,
        'bottom-left': 0, 'bottom-right': 0
    }
    
    for point in gaze_data:
        is_left = point.x < viewport_width / 2
        is_top = point.y < viewport_height / 2
        
        if is_top and is_left:
            quadrants['top-left'] += 1
        elif is_top and not is_left:
            quadrants['top-right'] += 1
        elif not is_top and is_left:
            quadrants['bottom-left'] += 1
        else:
            quadrants['bottom-right'] += 1
    
    total = sum(quadrants.values())
    percentages = {k: (v / total * 100) for k, v in quadrants.items()}
    
    # Check if bottom areas are ignored
    bottom_attention = percentages['bottom-left'] + percentages['bottom-right']
    if bottom_attention < 20:
        suggestions.append(OptimizationSuggestion(
            issue="Below-the-fold blindness detected",
            recommendation="Move critical CTAs and content higher on the page. Users are not scrolling to see lower content.",
            code="// Position important elements in top 60% of viewport\n<div className=\"mt-8\"> → <div className=\"mt-2\">",
            estimated_impact=25,
            severity='high'
        ))
    
    # Check for imbalanced attention
    max_attention = max(percentages.values())
    if max_attention > 60:
        dominant_area = max(percentages, key=percentages.get)
        suggestions.append(OptimizationSuggestion(
            issue=f"Attention heavily concentrated in {dominant_area} ({max_attention:.0f}%)",
            recommendation="Rebalance layout to distribute visual weight more evenly. Use whitespace and visual hierarchy to guide attention.",
            estimated_impact=15,
            severity='medium'
        ))
    
    return suggestions

def analyze_scanpath(gaze_data: List[GazePoint]) -> List[OptimizationSuggestion]:
    """Analyze how users move their eyes"""
    suggestions = []
    
    if len(gaze_data) < 10:
        return suggestions
    
    # Calculate scanpath length (total eye movement distance)
    total_distance = 0
    for i in range(1, len(gaze_data)):
        dx = gaze_data[i].x - gaze_data[i-1].x
        dy = gaze_data[i].y - gaze_data[i-1].y
        distance = math.sqrt(dx**2 + dy**2)
        total_distance += distance
    
    avg_saccade = total_distance / len(gaze_data)
    
    # High scanpath complexity = confused users
    if avg_saccade > 200:
        suggestions.append(OptimizationSuggestion(
            issue="High scanpath complexity - users are searching/confused",
            recommendation="Improve visual hierarchy with clearer headings, better contrast, and logical content flow. Consider F-pattern or Z-pattern layout.",
            code="// Example: Strengthen hierarchy\n<h2 className=\"text-2xl\"> → <h2 className=\"text-4xl font-bold\">",
            estimated_impact=30,
            severity='high'
        ))
    
    # Calculate fixation clusters (areas where eyes linger)
    # This would use actual clustering algorithm in production
    
    return suggestions

def analyze_dwell_times(gaze_data: List[GazePoint]) -> List[OptimizationSuggestion]:
    """Analyze how long users look at areas"""
    suggestions = []
    
    if len(gaze_data) < 2:
        return suggestions
    
    # Calculate time differences between points
    dwell_times = []
    for i in range(1, len(gaze_data)):
        dt = gaze_data[i].timestamp - gaze_data[i-1].timestamp
        if 0 < dt < 5000:  # Reasonable dwell time
            dwell_times.append(dt)
    
    if not dwell_times:
        return suggestions
    
    avg_dwell = statistics.mean(dwell_times)
    
    # Very short dwell = content not engaging
    if avg_dwell < 200:
        suggestions.append(OptimizationSuggestion(
            issue="Very short dwell times - content may not be engaging",
            recommendation="Add visual interest: images, icons, color contrast. Break up large text blocks.",
            estimated_impact=20,
            severity='medium'
        ))
    
    # Very long dwell = content confusing or hard to read
    elif avg_dwell > 800:
        suggestions.append(OptimizationSuggestion(
            issue="Long dwell times - content may be difficult to process",
            recommendation="Simplify language, increase font size, improve contrast. Use bullet points instead of paragraphs.",
            code="// Improve readability\n<p className=\"text-sm\"> → <p className=\"text-lg leading-relaxed\">",
            estimated_impact=25,
            severity='medium'
        ))
    
    return suggestions

def analyze_tracking_quality(gaze_data: List[GazePoint]) -> List[OptimizationSuggestion]:
    """Check if eye tracking is working well"""
    suggestions = []
    
    if not gaze_data:
        return suggestions
    
    low_confidence_points = [p for p in gaze_data if p.confidence < 0.5]
    low_confidence_ratio = len(low_confidence_points) / len(gaze_data)
    
    if low_confidence_ratio > 0.3:
        suggestions.append(OptimizationSuggestion(
            issue="Low eye tracking accuracy detected",
            recommendation="User should recalibrate eye tracking or improve lighting. This doesn't affect the component, just data quality.",
            estimated_impact=0,
            severity='low'
        ))
    
    return suggestions

def generate_heatmap_zones(gaze_data: List[GazePoint]) -> Dict:
    """Generate heatmap data for visualization"""
    # Create 10x10 grid of viewport
    grid_size = 10
    viewport_width = 1920
    viewport_height = 1080
    
    cell_width = viewport_width / grid_size
    cell_height = viewport_height / grid_size
    
    heatmap = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    
    for point in gaze_data:
        col = min(int(point.x / cell_width), grid_size - 1)
        row = min(int(point.y / cell_height), grid_size - 1)
        heatmap[row][col] += 1
    
    # Find hotspots (cells with > avg + stdev)
    all_values = [cell for row in heatmap for cell in row]
    if all_values:
        avg = statistics.mean(all_values)
        stdev = statistics.stdev(all_values) if len(all_values) > 1 else 0
        threshold = avg + stdev
        
        hotspots = []
        for row in range(grid_size):
            for col in range(grid_size):
                if heatmap[row][col] > threshold:
                    hotspots.append({
                        'x': col * cell_width + cell_width / 2,
                        'y': row * cell_height + cell_height / 2,
                        'intensity': heatmap[row][col]
                    })
        
        return {
            'grid': heatmap,
            'hotspots': hotspots,
            'grid_size': grid_size
        }
    
    return {}

if __name__ == "__main__":
    gaze_optimizer.run()

