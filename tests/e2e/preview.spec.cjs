const {test,expect}=require('@playwright/test');
test('solo session validates entry, supports leaving and finishes automatically',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('/');
 await page.getByRole('button',{name:'Try a guided session'}).click();
 await expect(page.getByRole('button',{name:'Enter solo session'})).toBeDisabled();
 await page.getByLabel('Display name',{exact:true}).fill('Pilot visitor');
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Enter solo session'}).click();
 await page.getByRole('button',{name:'Raise hand',exact:true}).click();
 await expect(page.getByRole('button',{name:'Lower hand'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Finish session early'}).click();await page.getByRole('button',{name:'Stay here'}).click();
 await page.clock.fastForward(1200001);
 await expect(page.getByText('Your session has ended.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Back to OpenRoom'}).click();
 await expect(page.getByText('1 session finished during this visit.',{exact:false})).toBeVisible();
 expect(errors).toEqual([]);
});
test('mobile layout fits and live availability is honest',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Join an invited audio meeting'}).click();
 await expect(page.getByRole('heading',{name:'Live rooms are being prepared.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Join with microphone off'})).toHaveCount(0);
});
