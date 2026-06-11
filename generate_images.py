import requests
import json
import time

API_KEY = 'sk-ALG1yoXRHA3xqV6xthiD4CYSgsRA2xorRZwQh1QAD29UnvnO'
BASE_URL = 'https://api.evolink.net/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# 定义所有需要生成的图片
images_to_generate = [
    # 1. Hero背景 - 香港维港夜景
    {
        'filename': 'hero_hk_night.jpg',
        'prompt': 'Stunning aerial view of Hong Kong Victoria Harbour at night, iconic skyline with illuminated skyscrapers, golden and warm amber lights reflecting on water, dramatic clouds, cinematic composition, ultra high quality, professional photography, 8K resolution, luxury and sophistication atmosphere, dark moody tones with golden highlights'
    },
    # 2. 关于州际 - 中国商务团队
    {
        'filename': 'about_chinese_team.jpg',
        'prompt': 'Professional Chinese business team in modern office, diverse group of Asian professionals in elegant business attire, confident and warm expressions, contemporary minimalist office interior with warm lighting, high-end corporate photography style, soft natural light, sophisticated and trustworthy atmosphere, 8K quality'
    },
    # 3. 香港建筑 - 现代感
    {
        'filename': 'about_hk_modern.jpg',
        'prompt': 'Modern Hong Kong architecture detail, sleek glass and steel building facade, geometric patterns, golden hour lighting, contemporary urban design, minimalist composition, professional architectural photography, luxury real estate aesthetic, warm amber and cool blue tones, 8K resolution'
    },
    # 4. 香港全景价值
    {
        'filename': 'value_hk_panorama.jpg',
        'prompt': 'Breathtaking Hong Kong cityscape panorama, Victoria Peak view, dramatic sky, layers of mountains and modern skyscrapers, golden sunset light, sense of opportunity and global connection, cinematic wide angle, professional travel photography, rich colors with golden accents, 8K ultra high quality'
    },
    # 5. 教育优势 - 学生形象
    {
        'filename': 'edu_student_happy.jpg',
        'prompt': 'Happy young Chinese students studying together, bright and energetic atmosphere, modern university campus background, natural genuine smiles, warm sunlight, aspirational and hopeful mood, professional lifestyle photography, shallow depth of field, vibrant but sophisticated color grading, 8K quality'
    },
    # 6. 高才专才 - 成功人士
    {
        'filename': 'program_success.jpg',
        'prompt': 'Confident successful Chinese business executive, professional portrait, elegant dark suit, modern office backdrop with city view, warm professional lighting, sense of achievement and sophistication, high-end corporate headshot style, shallow depth of field, rich warm tones, 8K resolution'
    },
    # 7. 申请流程 - 握手合作
    {
        'filename': 'process_partnership.jpg',
        'prompt': 'Professional handshake between business partners, close-up detail, elegant watches and business attire, warm golden lighting, sense of trust and partnership, shallow depth of field, luxury corporate photography, sophisticated color palette with gold accents, 8K quality'
    },
    # 8. 精英团队 - 专业形象
    {
        'filename': 'team_professional.jpg',
        'prompt': 'Group of professional Chinese consultants in modern office, confident poses, elegant business wear, contemporary workspace with warm ambient lighting, teamwork and expertise atmosphere, high-end corporate photography, natural expressions, sophisticated color grading, 8K resolution'
    },
    # 9. 成功案例 - 毕业典礼
    {
        'filename': 'case_graduation.jpg',
        'prompt': 'Chinese graduate in cap and gown celebrating success, prestigious university campus background, genuine joy and achievement, warm golden hour lighting, aspirational and proud moment, professional graduation photography, shallow depth of field, rich warm tones, 8K quality'
    },
    # 10. 联系我们 - 现代办公室
    {
        'filename': 'contact_office.jpg',
        'prompt': 'Luxurious modern office reception area, elegant minimalist design, warm natural light through floor-to-ceiling windows, city skyline view, sophisticated interior design with gold accents, high-end corporate environment, professional architectural photography, 8K resolution'
    },
    # 11. 教育图表背景
    {
        'filename': 'edu_chart_bg.jpg',
        'prompt': 'Abstract data visualization background, elegant charts and graphs, soft gradient from cream to light gold, minimalist modern design, professional business infographic aesthetic, subtle grid patterns, sophisticated color palette, 8K quality, perfect for text overlay'
    },
    # 12. 香港价值 - 金融区
    {
        'filename': 'value_finance.jpg',
        'prompt': 'Hong Kong Central financial district, modern banking towers, sophisticated urban landscape, golden sunset light reflecting on glass buildings, sense of prosperity and global finance, professional cityscape photography, rich warm tones, 8K resolution'
    }
]

print('开始生成图片...')
results = []

for img in images_to_generate:
    try:
        print(f'\n生成: {img["filename"]}')
        
        # 提交生成任务
        response = requests.post(
            f'{BASE_URL}/images/generations',
            headers=headers,
            json={
                'model': 'gemini-3.1-flash-image-preview',
                'prompt': img['prompt'],
                'n': 1,
                'size': '1024x1536',
                'quality': 'high'
            },
            timeout=120
        )
        
        if response.status_code != 200:
            print(f'  错误: {response.status_code} - {response.text}')
            continue
            
        data = response.json()
        task_id = data.get('task_id')
        
        if not task_id:
            print(f'  未获取到task_id')
            continue
            
        print(f'  Task ID: {task_id}')
        
        # 轮询查询结果
        max_retries = 30
        for i in range(max_retries):
            time.sleep(3)
            
            query_response = requests.get(
                f'{BASE_URL}/images/generations/{task_id}',
                headers=headers,
                timeout=30
            )
            
            if query_response.status_code == 200:
                result = query_response.json()
                status = result.get('status')
                
                if status == 'completed':
                    image_url = result.get('result_data', [{}])[0].get('url')
                    if image_url:
                        print(f'  完成! URL: {image_url[:80]}...')
                        results.append({
                            'filename': img['filename'],
                            'url': image_url,
                            'task_id': task_id
                        })
                        break
                elif status == 'failed':
                    print(f'  生成失败')
                    break
                    
        else:
            print(f'  超时')
            
    except Exception as e:
        print(f'  异常: {e}')

# 保存结果
with open('icc_website_v2/images/generated_images.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f'\n\n总共生成: {len(results)} 张图片')
for r in results:
    print(f"  - {r['filename']}: {r['url'][:60]}...")
